package com.example.scolarite.service;

import com.example.scolarite.dto.PendingUserDto;
import com.example.scolarite.dto.ProfileDto;
import com.example.scolarite.dto.RegisterRequestDto;
import com.example.scolarite.dto.UserImportDto;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;


@Service
public class KeycloakUserService {

    private final Keycloak keycloak;
    private final String realm;

    public KeycloakUserService(Keycloak keycloak,
                               @Value("${keycloak.realm}") String realm) {
        this.keycloak = keycloak;
        this.realm = realm;
    }

    // ==================== MÉTHODE EXISTANTE POUR L'IMPORT CSV ====================
    /**
     * Create a user in Keycloak with temporary password and required actions
     * Utilisé pour l'import CSV par l'admin - Création directe sans validation
     */
    public String createUser(UserImportDto userDto, String temporaryPassword) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Check if user already exists
            List<UserRepresentation> existingUsers = usersResource.search(userDto.getUsername(), true);
            if (!existingUsers.isEmpty()) {
                return "User " + userDto.getUsername() + " already exists";
            }

            // Check if email already exists
            if (userDto.getEmail() != null && !userDto.getEmail().isEmpty()) {
                List<UserRepresentation> usersByEmail = usersResource.searchByEmail(userDto.getEmail(), true);
                if (!usersByEmail.isEmpty()) {
                    return "Email " + userDto.getEmail() + " already registered";
                }
            }

            // Create user representation
            UserRepresentation user = new UserRepresentation();
            user.setUsername(userDto.getUsername());
            user.setEmail(userDto.getEmail());
            user.setFirstName(userDto.getFirstName());
            user.setLastName(userDto.getLastName());
            user.setEnabled(true);
            user.setEmailVerified(true); // Auto-verified for admin imports
            user.setRequiredActions(Arrays.asList("UPDATE_PASSWORD"));

            // Create the user
            Response response = usersResource.create(user);

            if (response.getStatus() != 201) {
                return "Failed to create user: " + response.getStatusInfo().getReasonPhrase();
            }

            // Get the created user ID from location header
            String userId = extractUserIdFromResponse(response);

            // Set password
            setUserPassword(userId, temporaryPassword);

            // Assign role
            if (userDto.getRole() != null && !userDto.getRole().isEmpty()) {
                assignRoleToUser(userId, userDto.getRole());
            }

            return null; // No error

        } catch (Exception e) {
            e.printStackTrace();
            return "Error creating user " + userDto.getUsername() + ": " + e.getMessage();
        }
    }

    // ==================== NOUVELLES MÉTHODES POUR L'INSCRIPTION AVEC VALIDATION ====================

    /**
     * Inscription d'un utilisateur en attente de validation
     */
    public String registerPendingUser(RegisterRequestDto registerDto) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Vérifier si l'utilisateur existe déjà
            List<UserRepresentation> existingUsers = usersResource.search(registerDto.getUsername(), true);
            if (!existingUsers.isEmpty()) {
                return "User " + registerDto.getUsername() + " already exists";
            }

            // Vérifier si l'email existe déjà
            if (registerDto.getEmail() != null && !registerDto.getEmail().isEmpty()) {
                List<UserRepresentation> usersByEmail = usersResource.searchByEmail(registerDto.getEmail(), true);
                if (!usersByEmail.isEmpty()) {
                    return "Email " + registerDto.getEmail() + " already registered";
                }
            }

            // Créer la représentation de l'utilisateur
            UserRepresentation user = new UserRepresentation();
            user.setUsername(registerDto.getUsername());
            user.setEmail(registerDto.getEmail());
            user.setFirstName(registerDto.getFirstName());
            user.setLastName(registerDto.getLastName());
            user.setEnabled(true);
            user.setEmailVerified(false);

            // ✅ AJOUTER LE CIN DANS LES ATTRIBUTS
            Map<String, List<String>> attributes = new HashMap<>();
            attributes.put("cin", List.of(registerDto.getCin())); // AJOUT IMPORTANT
            attributes.put("requestedRole", List.of(registerDto.getRole() != null ? registerDto.getRole() : "STUDENT"));
            attributes.put("registrationDate", List.of(new Date().toString()));
            user.setAttributes(attributes);

            // Actions requises: UPDATE_PASSWORD pour forcer le changement de mot de passe
            user.setRequiredActions(Arrays.asList("UPDATE_PASSWORD"));

            // Créer l'utilisateur
            Response response = usersResource.create(user);

            if (response.getStatus() != 201) {
                return "Failed to create user: " + response.getStatusInfo().getReasonPhrase();
            }

            // Obtenir l'ID de l'utilisateur créé
            String userId = extractUserIdFromResponse(response);

            // ✅ CORRECTION: Utiliser le CIN comme mot de passe, PAS le champ password
            setUserPassword(userId, registerDto.getCin());

            // Assigner le rôle PENDING
            assignRoleToUser(userId, "PENDING");

            return null; // Pas d'erreur

        } catch (Exception e) {
            e.printStackTrace();
            return "Error registering user " + registerDto.getUsername() + ": " + e.getMessage();
        }
    }
    /**
     * Obtenir tous les utilisateurs en attente (avec rôle PENDING)
     */

    public List<PendingUserDto> getPendingUsers() {
        List<PendingUserDto> pendingUsers = new ArrayList<>();

        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Récupérer TOUS les utilisateurs avec pagination (max 1000)
            List<UserRepresentation> users = usersResource.list(0, 1000);

            for (UserRepresentation user : users) {
                try {
                    // Récupérer les rôles de l'utilisateur
                    UserResource userResource = usersResource.get(user.getId());
                    List<RoleRepresentation> userRoles = userResource.roles().realmLevel().listAll();

                    // Vérifier si l'utilisateur a le rôle PENDING
                    boolean hasPendingRole = userRoles.stream()
                            .anyMatch(role -> "PENDING".equals(role.getName()));

                    if (hasPendingRole) {
                        PendingUserDto dto = new PendingUserDto();
                        dto.setId(user.getId());
                        dto.setUsername(user.getUsername());
                        dto.setEmail(user.getEmail());
                        dto.setFirstName(user.getFirstName());
                        dto.setLastName(user.getLastName());
                        dto.setCreatedTimestamp(user.getCreatedTimestamp() != null ?
                                new Date(user.getCreatedTimestamp()) : new Date());

                        // Récupérer le rôle demandé depuis les attributs
                        if (user.getAttributes() != null && user.getAttributes().containsKey("requestedRole")) {
                            dto.setRequestedRole(user.getAttributes().get("requestedRole").get(0));
                        } else {
                            dto.setRequestedRole("STUDENT");
                        }

                        pendingUsers.add(dto);
                    }
                } catch (Exception e) {
                    // Log silencieux ou à enlever complètement
                    // System.err.println("Erreur pour l'utilisateur " + user.getUsername() + ": " + e.getMessage());
                }
            }

        } catch (Exception e) {
            // Log silencieux ou à enlever complètement
            // System.err.println("Erreur dans getPendingUsers: " + e.getMessage());
            // e.printStackTrace();
        }

        return pendingUsers;
    }
    /**
     * Approuver un utilisateur et lui assigner des rôles
     */
    public String approveUser(String userId, List<String> roles) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            // Retirer le rôle PENDING
            try {
                RoleRepresentation pendingRole = realmResource.roles().get("PENDING").toRepresentation();
                userResource.roles().realmLevel().remove(Collections.singletonList(pendingRole));
            } catch (Exception e) {
                System.err.println("Could not remove PENDING role: " + e.getMessage());
            }

            // Assigner les nouveaux rôles
            for (String roleName : roles) {
                try {
                    RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
                    userResource.roles().realmLevel().add(Collections.singletonList(role));
                } catch (Exception e) {
                    System.err.println("Could not assign role " + roleName + ": " + e.getMessage());
                }
            }

            // Mettre à jour l'utilisateur (email vérifié)
            UserRepresentation user = userResource.toRepresentation();
            user.setEmailVerified(true);

            // Ajouter un attribut pour marquer la validation
            Map<String, List<String>> attributes = user.getAttributes();
            if (attributes == null) {
                attributes = new HashMap<>();
            }
            attributes.put("approvedDate", List.of(new Date().toString()));
            attributes.put("approvedBy", List.of("admin")); // Idéalement, récupérer l'admin connecté
            user.setAttributes(attributes);

            userResource.update(user);

            return null; // Succès

        } catch (Exception e) {
            e.printStackTrace();
            return "Error approving user: " + e.getMessage();
        }
    }

    /**
     * Rejeter un utilisateur (supprimer le compte)
     */
    public String rejectUser(String userId, String reason) {
        try {
            RealmResource realmResource = keycloak.realm(realm);

            // Optionnel: sauvegarder la raison avant suppression (dans un système de logs)
            System.out.println("User " + userId + " rejected. Reason: " + reason);

            // Supprimer l'utilisateur
            realmResource.users().delete(userId);

            return null; // Succès

        } catch (Exception e) {
            e.printStackTrace();
            return "Error rejecting user: " + e.getMessage();
        }
    }

    /**
     * Obtenir les rôles disponibles (excluant PENDING)
     */
    public List<String> getAvailableRoles() {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            return realmResource.roles().list().stream()
                    .map(RoleRepresentation::getName)
                    .filter(name -> !name.equals("PENDING") && !name.equals("uma_authorization"))
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of("STUDENT", "PROFESSOR", "ADMIN"); // Default fallback
        }
    }

    /**
     * Vérifier si un nom d'utilisateur est disponible
     */
    public boolean isUsernameAvailable(String username) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            List<UserRepresentation> existingUsers = usersResource.search(username, true);
            return existingUsers.isEmpty();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Vérifier si un email est disponible
     */
    public boolean isEmailAvailable(String email) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            List<UserRepresentation> usersByEmail = usersResource.searchByEmail(email, true);
            return usersByEmail.isEmpty();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ==================== MÉTHODES PRIVÉES EXISTANTES ====================

    /**
     * Set user password
     */
    private void setUserPassword(String userId, String password) {
        RealmResource realmResource = keycloak.realm(realm);
        UserResource userResource = realmResource.users().get(userId);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(true); // Important: this makes it temporary

        userResource.resetPassword(credential);
    }

    /**
     * Assign role to user
     */
    private void assignRoleToUser(String userId, String roleName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            // Find the role in the realm
            RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();

            // Assign role to user
            userResource.roles().realmLevel().add(Collections.singletonList(role));
        } catch (Exception e) {
            System.err.println("Could not assign role " + roleName + " to user " + userId + ": " + e.getMessage());
            // Don't throw exception, role assignment is optional
        }
    }

    /**
     * Extract user ID from Keycloak response location header
     */
    private String extractUserIdFromResponse(Response response) {
        String location = response.getLocation().getPath();
        return location.substring(location.lastIndexOf('/') + 1);
    }

    /**
     * Get all available roles in the realm (méthode existante)
     */
    public List<String> getAllRoles() {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            return realmResource.roles().list().stream()
                    .map(RoleRepresentation::getName)
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of("STUDENT", "PROFESSOR", "ADMIN"); // Default fallback
        }
    }



    /**
     * Récupérer le profil complet d'un utilisateur
     */
    public ProfileDto getUserProfile(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            ProfileDto profile = new ProfileDto();
            profile.setId(user.getId());
            profile.setUsername(user.getUsername());
            profile.setEmail(user.getEmail());
            profile.setFirstName(user.getFirstName());
            profile.setLastName(user.getLastName());
            profile.setCreatedTimestamp(user.getCreatedTimestamp());
            profile.setEmailVerified(user.isEmailVerified());
            profile.setEnabled(user.isEnabled());

            // Récupérer le CIN depuis les attributs
            if (user.getAttributes() != null) {
                Map<String, List<String>> attributes = user.getAttributes();

                // Récupérer le CIN
                if (attributes.containsKey("cin")) {
                    profile.setCin(attributes.get("cin").get(0));
                }

                // Récupérer les attributs existants
                if (attributes.containsKey("requestedRole")) {
                    profile.setRequestedRole(attributes.get("requestedRole").get(0));
                }
                if (attributes.containsKey("registrationDate")) {
                    profile.setRegistrationDate(attributes.get("registrationDate").get(0));
                }
                if (attributes.containsKey("approvedDate")) {
                    profile.setApprovedDate(attributes.get("approvedDate").get(0));
                }
                if (attributes.containsKey("approvedBy")) {
                    profile.setApprovedBy(attributes.get("approvedBy").get(0));
                }

                // Garder tous les attributs pour référence
                profile.setAttributes(attributes);
            }

            // Récupérer TOUS les rôles de l'utilisateur
            List<RoleRepresentation> userRoles = userResource.roles().realmLevel().listAll();
            List<String> allRoles = userRoles.stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());

            // Filtrer pour identifier le rôle métier principal
            List<String> businessRoles = allRoles.stream()
                    .filter(role -> role.equals("STUDENT") ||
                            role.equals("PROFESSOR") ||
                            role.equals("ADMIN"))
                    .collect(Collectors.toList());

            // Si aucun rôle métier trouvé, déterminer le rôle approprié
            if (businessRoles.isEmpty()) {
                if (allRoles.contains("PENDING")) {
                    businessRoles = List.of("PENDING");
                } else {
                    businessRoles = List.of("USER");
                }
            }

            profile.setRoles(businessRoles);
            profile.setAllRoles(allRoles); // Garder tous les rôles pour référence

            return profile;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la récupération du profil: " + e.getMessage());
        }
    }

        /**
         * Mettre à jour le profil utilisateur
         */
    public String updateUserProfile(String userId, ProfileDto profileDto) {
            try {
                RealmResource realmResource = keycloak.realm(realm);
                UserResource userResource = realmResource.users().get(userId);
                UserRepresentation user = userResource.toRepresentation();

                // Mettre à jour les champs modifiables
                if (profileDto.getFirstName() != null) {
                    user.setFirstName(profileDto.getFirstName());
                }
                if (profileDto.getLastName() != null) {
                    user.setLastName(profileDto.getLastName());
                }
                if (profileDto.getEmail() != null && !profileDto.getEmail().equals(user.getEmail())) {
                    List<UserRepresentation> usersByEmail = realmResource.users()
                            .searchByEmail(profileDto.getEmail(), true);
                    if (!usersByEmail.isEmpty() && !usersByEmail.get(0).getId().equals(userId)) {
                        return "Cet email est déjà utilisé";
                    }
                    user.setEmail(profileDto.getEmail());
                    user.setEmailVerified(false);
                }

                // Validation et mise à jour du CIN
                if (profileDto.getCin() != null) {
                    String cin = profileDto.getCin().trim();
                    if (cin.isEmpty()) {
                        return "Le CIN ne peut pas être vide";
                    }
                    // Validation basique pour un CIN tunisien (8 chiffres)
                    if (!cin.matches("\\d{8}")) {
                        return "Le CIN doit contenir exactement 8 chiffres";
                    }

                    Map<String, List<String>> attributes = user.getAttributes();
                    if (attributes == null) {
                        attributes = new HashMap<>();
                    }
                    attributes.put("cin", List.of(cin));
                    user.setAttributes(attributes);
                }

                userResource.update(user);
                return null;

            } catch (Exception e) {
                e.printStackTrace();
                return "Erreur lors de la mise à jour: " + e.getMessage();
            }
        }        /**
         * Changer le mot de passe (version améliorée avec gestion d'erreur)
         */
        public String changePassword(String userId, String newPassword) {
            return changePassword(userId, null, newPassword); // Appel à la méthode complète
        }

        /**
         * Changer le mot de passe avec vérification optionnelle de l'ancien
         */
        public String changePassword(String userId, String currentPassword, String newPassword) {
            try {
                RealmResource realmResource = keycloak.realm(realm);
                UserResource userResource = realmResource.users().get(userId);

                // Optionnel: Vérifier l'ancien mot de passe si fourni
                if (currentPassword != null && !currentPassword.isEmpty()) {
                    // Note: Pour une vraie vérification, il faudrait utiliser l'endpoint d'authentification
                    // Ceci est une simplification - en production, utilisez un appel séparé à Keycloak
                    System.out.println("Password verification would happen here in production");
                }

                // Créer le nouveau credential (comme dans votre setUserPassword)
                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType(CredentialRepresentation.PASSWORD);
                credential.setValue(newPassword);
                credential.setTemporary(false); // Permanent

                userResource.resetPassword(credential);

                return null; // Succès

            } catch (Exception e) {
                e.printStackTrace();
                return "Error changing password: " + e.getMessage();
            }
        }

        /**
         * Obtenir le rôle principal d'un utilisateur
         */
        public String getUserPrimaryRole(String userId) {
            try {
                ProfileDto profile = getUserProfile(userId);
                if (profile.getRoles() != null && !profile.getRoles().isEmpty()) {
                    return profile.getRoles().get(0); // Premier rôle = rôle principal
                }
                return "USER";
            } catch (Exception e) {
                e.printStackTrace();
                return "USER";
            }
        }

        /**
         * Vérifier si un utilisateur a un rôle spécifique
         */
        public boolean userHasRole(String userId, String roleName) {
            try {
                RealmResource realmResource = keycloak.realm(realm);
                UserResource userResource = realmResource.users().get(userId);

                List<RoleRepresentation> userRoles = userResource.roles().realmLevel().listAll();
                return userRoles.stream()
                        .anyMatch(role -> roleName.equals(role.getName()));

            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        /**
         * Récupérer le profil par username (utile pour l'authentification)
         */
        public ProfileDto getUserProfileByUsername(String username) {
            try {
                RealmResource realmResource = keycloak.realm(realm);
                UsersResource usersResource = realmResource.users();

                List<UserRepresentation> users = usersResource.search(username, true);
                if (users.isEmpty()) {
                    return null;
                }

                // Prendre le premier utilisateur correspondant
                String userId = users.get(0).getId();
                return getUserProfile(userId);

            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("Erreur lors de la récupération du profil par username: " + e.getMessage());
            }
        }




}
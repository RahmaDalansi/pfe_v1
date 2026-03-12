package com.example.scolarite.service;

import com.example.scolarite.dto.PendingUserDto;
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
            user.setEmailVerified(false); // Email non vérifié

            // Ajouter l'attribut pour le rôle demandé
            Map<String, List<String>> attributes = new HashMap<>();
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

            // Définir le mot de passe (temporaire)
            setUserPassword(userId, registerDto.getPassword());

            // Assigner le rôle PENDING (en attente de validation)
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
            List<UserRepresentation> users = usersResource.list(0, 1000); // 0 = premier résultat, 1000 = max
            System.out.println("🔍 Nombre total d'utilisateurs dans Keycloak: " + users.size());

            // Debug : afficher les 5 premiers utilisateurs avec leurs rôles
            int count = 0;
            for (UserRepresentation user : users) {
                if (count < 5) { // Afficher seulement les 5 premiers pour le debug
                    try {
                        UserResource userResource = usersResource.get(user.getId());
                        List<RoleRepresentation> userRoles = userResource.roles().realmLevel().listAll();
                        System.out.println("👤 Utilisateur: " + user.getUsername() +
                                ", Rôles: " + userRoles.stream()
                                .map(RoleRepresentation::getName)
                                .collect(java.util.stream.Collectors.toList()));
                    } catch (Exception e) {
                        System.out.println("❌ Erreur récupération rôles pour " + user.getUsername());
                    }
                    count++;
                }

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
                        System.out.println("✅ Utilisateur PENDING trouvé: " + user.getUsername());
                    }
                } catch (Exception e) {
                    System.err.println("❌ Erreur pour l'utilisateur " + user.getUsername() + ": " + e.getMessage());
                }
            }

            System.out.println("🎯 Total utilisateurs PENDING trouvés: " + pendingUsers.size());

        } catch (Exception e) {
            System.err.println("❌ Erreur dans getPendingUsers: " + e.getMessage());
            e.printStackTrace();
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
}
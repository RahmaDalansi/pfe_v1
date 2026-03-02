package com.example.scolarite.service;

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

    /**
     * Create a user in Keycloak with temporary password and required actions
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

            // Create user representation
            UserRepresentation user = new UserRepresentation();
            user.setUsername(userDto.getUsername());
            user.setEmail(userDto.getEmail());
            user.setFirstName(userDto.getFirstName());
            user.setLastName(userDto.getLastName());
            user.setEnabled(true);

            // Set email as verified (optional - set to false if you want email verification)
            user.setEmailVerified(true);

            // Set required actions - FORCE PASSWORD CHANGE
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
     * Get all available roles in the realm
     */
    public List<String> getAllRoles() {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            return realmResource.roles().list().stream()
                    .map(role -> role.getName())
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of("STUDENT", "PROFESSOR", "ADMIN"); // Default fallback
        }
    }
}
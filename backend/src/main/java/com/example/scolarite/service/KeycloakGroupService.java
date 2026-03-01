package com.example.scolarite.service;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
public class KeycloakGroupService {

    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    private Keycloak keycloak;

    @PostConstruct
    public void init() {
        // Initialisation simplifiée sans secret client
        this.keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master")
                .username(adminUsername)
                .password(adminPassword)
                .clientId("admin-cli")
                .build();
    }

    public void addUserToGroup(String userId, String groupName) {
        RealmResource realmResource = keycloak.realm(realm);

        List<GroupRepresentation> groups = realmResource.groups().groups();
        GroupRepresentation targetGroup = groups.stream()
                .filter(g -> groupName.equals(g.getName()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé: " + groupName));

        realmResource.users().get(userId).joinGroup(targetGroup.getId());
    }

    public void removeUserFromGroup(String userId, String groupName) {
        RealmResource realmResource = keycloak.realm(realm);

        List<GroupRepresentation> groups = realmResource.groups().groups();
        GroupRepresentation targetGroup = groups.stream()
                .filter(g -> groupName.equals(g.getName()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé: " + groupName));

        realmResource.users().get(userId).leaveGroup(targetGroup.getId());
    }

    public List<GroupRepresentation> getUserGroups(String userId) {
        return keycloak.realm(realm)
                .users()
                .get(userId)
                .groups();
    }

    public String getUserIdByUsername(String username) {
        List<UserRepresentation> users = keycloak.realm(realm)
                .users()
                .search(username, true);

        if (users.isEmpty()) {
            throw new RuntimeException("Utilisateur non trouvé: " + username);
        }

        return users.get(0).getId();
    }

    public void promoteToAdmin(String userId) {
        try {
            removeUserFromGroup(userId, "PROFESSORS");
        } catch (Exception e) {
            // Ignorer
        }
        addUserToGroup(userId, "ADMINS");
    }

    public void demoteToProfessor(String userId) {
        try {
            removeUserFromGroup(userId, "ADMINS");
        } catch (Exception e) {
            // Ignorer
        }
        addUserToGroup(userId, "PROFESSORS");
    }
}
package com.example.scolarite;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class KeycloakRoleConverter extends JwtAuthenticationConverter {

    public KeycloakRoleConverter() {
        setJwtGrantedAuthoritiesConverter(new KeycloakGroupsAndRolesConverter());
    }

    private static class KeycloakGroupsAndRolesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Set<GrantedAuthority> authorities = new HashSet<>();

            // 1. Extraire les rôles existants
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && !realmAccess.isEmpty()) {
                Object rolesObj = realmAccess.get("roles");
                if (rolesObj instanceof Collection) {
                    @SuppressWarnings("unchecked")
                    Collection<String> roles = (Collection<String>) rolesObj;

                    if (roles != null && !roles.isEmpty()) {
                        // Ajouter les rôles avec le préfixe ROLE_
                        roles.stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                .forEach(authorities::add);
                    }
                }
            }

            // 2. Extraire les groupes du token
            List<String> groups = null;
            Object groupsObj = jwt.getClaim("groups");
            if (groupsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> groupsList = (List<String>) groupsObj;
                groups = groupsList;
            }

            if (groups == null) {
                groupsObj = jwt.getClaim("group_membership");
                if (groupsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<String> groupsList = (List<String>) groupsObj;
                    groups = groupsList;
                }
            }

            if (groups != null && !groups.isEmpty()) {
                // Convertir les groupes en authorities
                groups.stream()
                        .map(group -> {
                            String cleanGroup = group.startsWith("/") ? group.substring(1) : group;
                            return new SimpleGrantedAuthority("GROUP_" + cleanGroup);
                        })
                        .forEach(authorities::add);

                // Compatibilité avec hasRole()
                if (groups.stream().anyMatch(g -> g.contains("ADMINS") || g.equals("/ADMINS"))) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
                if (groups.stream().anyMatch(g -> g.contains("PROFESSORS") || g.equals("/PROFESSORS"))) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_PROFESSOR"));
                }
            }

            System.out.println("Authorities extraites: " + authorities);

            return authorities;
        }
    }
}
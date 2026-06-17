package com.smartWaste.project.service;

import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UsersRepository usersRepository;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<Users> user = usersRepository.findByEmail(email);
        
        if (user.isEmpty()) {
            System.out.println("[CustomUserDetailsService] User not found: " + email);
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        
        Users foundUser = user.get();
        System.out.println("[CustomUserDetailsService] Loading user: " + email + ", role: " + foundUser.getRole());
        
        return new org.springframework.security.core.userdetails.User(
            email,
            foundUser.getPassword(),
            getAuthorities(foundUser)
        );
    }
    
    private Collection<? extends GrantedAuthority> getAuthorities(Users user) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        
        if (user.getRole() != null) {
            String roleString = "ROLE_" + user.getRole().name();
            System.out.println("[CustomUserDetailsService] Granting authority: " + roleString);
            authorities.add(new SimpleGrantedAuthority(roleString));
        }
        
        return authorities;
    }
}

package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return userService.buscarPerfil(authentication.getName());
    }
}
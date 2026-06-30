package com.takeshi.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.takeshi.backend.entity.AppAllowedUser;

public interface AppAllowedUserRepository extends JpaRepository<AppAllowedUser, Long> {

    Optional<AppAllowedUser> findByEmailIgnoreCase(String email);
}

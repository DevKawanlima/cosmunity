package com.cosmunity.cosmunity_backend.marketplace.service;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MarketplaceAccessServiceTest {

    @Test
    void allowsActiveArtist() {
        ArtistRepository repository = mock(ArtistRepository.class);
        MarketplaceAccessService access = new MarketplaceAccessService(repository);
        Artist artist = artistWithStatus(true, true);
        when(repository.findByUsuario_EmailIgnoreCase("artist@example.com"))
                .thenReturn(Optional.of(artist));

        assertSame(artist, access.requireActiveArtist("artist@example.com"));
    }

    @Test
    void blocksArtistWhoIsNotActive() {
        ArtistRepository repository = mock(ArtistRepository.class);
        MarketplaceAccessService access = new MarketplaceAccessService(repository);
        when(repository.findByUsuario_EmailIgnoreCase("artist@example.com"))
                .thenReturn(Optional.of(artistWithStatus(false, true)));

        assertThrows(ResponseStatusException.class,
                () -> access.requireActiveArtist("artist@example.com"));
    }

    private Artist artistWithStatus(boolean artistActive, boolean userActive) {
        User user = new User();
        user.setAtivo(userActive);
        Artist artist = new Artist();
        artist.setUsuario(user);
        artist.setAtivo(artistActive);
        return artist;
    }
}

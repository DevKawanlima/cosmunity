package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ImagemPortfolioResponse;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioRequest;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioResponse;
import com.cosmunity.cosmunity_backend.service.PortfolioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PortfolioController {
    private final PortfolioService service;

    public PortfolioController(PortfolioService service) { this.service = service; }

    @GetMapping("/portfolio")
    public List<TrabalhoPortfolioResponse> listar() { return service.listar(); }

    @GetMapping("/artists/{artistaId}/portfolio")
    public List<TrabalhoPortfolioResponse> listarDoArtista(@PathVariable Long artistaId) {
        return service.listarDoArtista(artistaId);
    }

    @GetMapping("/portfolio/{id}")
    public TrabalhoPortfolioResponse buscar(@PathVariable Long id) { return service.buscar(id); }

    @PostMapping("/portfolio")
    public ResponseEntity<TrabalhoPortfolioResponse> criar(
            @Valid @RequestBody TrabalhoPortfolioRequest dados, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dados, email(authentication)));
    }

    @PutMapping("/portfolio/{id}")
    public TrabalhoPortfolioResponse atualizar(@PathVariable Long id,
            @Valid @RequestBody TrabalhoPortfolioRequest dados, Authentication authentication) {
        return service.atualizar(id, dados, email(authentication));
    }

    @DeleteMapping("/portfolio/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, Authentication authentication) {
        service.excluir(id, email(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/portfolio/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImagemPortfolioResponse> adicionarImagem(@PathVariable Long id,
            @RequestPart("arquivo") MultipartFile arquivo,
            @RequestParam(defaultValue = "0") int ordem,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.adicionarImagem(id, arquivo, ordem, email(authentication)));
    }

    @GetMapping("/portfolio/images/{imagemId}/file")
    public ResponseEntity<byte[]> baixarImagem(@PathVariable Long imagemId) {
        PortfolioService.ImagemCarregada imagem = service.carregarImagem(imagemId);
        return ResponseEntity.ok()
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(imagem.tipo()))
                .body(imagem.conteudo());
    }

    @DeleteMapping("/portfolio/images/{imagemId}")
    public ResponseEntity<Void> excluirImagem(@PathVariable Long imagemId, Authentication authentication) {
        service.excluirImagem(imagemId, email(authentication));
        return ResponseEntity.noContent().build();
    }

    private String email(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "É necessário fazer login.");
        }
        return authentication.getName();
    }
}

package com.cosmunity.cosmunity_backend.marketplace.model;

import com.cosmunity.cosmunity_backend.model.Artist;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "servico")
public class ServiceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servico")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_artista", nullable = false)
    private Artist artist;

    @Column(name = "titulo", nullable = false, length = 150)
    private String title;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String description;

    @Column(name = "preco", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "categoria", length = 100)
    private String category;

    @Column(name = "prazo_estimado_dias")
    private Integer estimatedDeliveryDays;

    @Column(name = "ativo", nullable = false)
    private boolean active = true;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "atualizado_em")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "serviceListing", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC, id ASC")
    private List<ServiceImage> images = new ArrayList<>();

    public ServiceListing() {
    }

    public void addImage(ServiceImage image) {
        images.add(image);
        image.setServiceListing(this);
    }

    public void removeImage(ServiceImage image) {
        images.remove(image);
        image.setServiceListing(null);
    }

    @PrePersist
    void beforeInsert() {
        createdAt = OffsetDateTime.now();
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Artist getArtist() { return artist; }
    public void setArtist(Artist artist) { this.artist = artist; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getEstimatedDeliveryDays() { return estimatedDeliveryDays; }
    public void setEstimatedDeliveryDays(Integer estimatedDeliveryDays) { this.estimatedDeliveryDays = estimatedDeliveryDays; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public List<ServiceImage> getImages() { return images; }
}

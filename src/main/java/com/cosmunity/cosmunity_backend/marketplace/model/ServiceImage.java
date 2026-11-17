package com.cosmunity.cosmunity_backend.marketplace.model;

import jakarta.persistence.*;

@Entity
@Table(name = "imagem_servico")
public class ServiceImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_imagem_servico")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_servico", nullable = false)
    private ServiceListing serviceListing;

    @Column(name = "imagem_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "ordem", nullable = false)
    private Integer orderIndex = 0;

    public ServiceImage() {
    }

    public ServiceImage(String imageUrl, Integer orderIndex) {
        this.imageUrl = imageUrl;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public ServiceListing getServiceListing() { return serviceListing; }
    public void setServiceListing(ServiceListing serviceListing) { this.serviceListing = serviceListing; }
    public String getImageUrl() { return imageUrl; }
    public Integer getOrderIndex() { return orderIndex; }
}

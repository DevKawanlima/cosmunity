package com.cosmunity.cosmunity_backend.marketplace.model;

import jakarta.persistence.*;

@Entity
@Table(name = "imagem_produto")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_imagem_produto")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private Product product;

    @Column(name = "imagem_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "ordem", nullable = false)
    private Integer orderIndex = 0;

    public ProductImage() {
    }

    public ProductImage(String imageUrl, Integer orderIndex) {
        this.imageUrl = imageUrl;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getImageUrl() { return imageUrl; }
    public Integer getOrderIndex() { return orderIndex; }
}

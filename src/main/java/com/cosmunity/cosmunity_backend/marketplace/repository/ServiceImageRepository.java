package com.cosmunity.cosmunity_backend.marketplace.repository;

import com.cosmunity.cosmunity_backend.marketplace.model.ServiceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ServiceImageRepository extends JpaRepository<ServiceImage, Long> {

    @Query("select image from ServiceImage image where image.serviceListing.id in :serviceIds order by image.orderIndex asc, image.id asc")
    List<ServiceImage> findAllForServices(@Param("serviceIds") Collection<Long> serviceIds);

    Optional<ServiceImage> findByIdAndServiceListing_Id(Long id, Long serviceId);
}

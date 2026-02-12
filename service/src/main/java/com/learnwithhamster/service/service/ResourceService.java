package com.learnwithhamster.service.service;

import com.learnwithhamster.service.service.dto.ResourceDTO;
import java.util.List;
import java.util.Optional;

/**
 * Service Interface for managing {@link com.learnwithhamster.service.domain.Resource}.
 */
public interface ResourceService {
    /**
     * Save a resource.
     *
     * @param resourceDTO the entity to save.
     * @return the persisted entity.
     */
    ResourceDTO save(ResourceDTO resourceDTO);

    /**
     * Updates a resource.
     *
     * @param resourceDTO the entity to update.
     * @return the persisted entity.
     */
    ResourceDTO update(ResourceDTO resourceDTO);

    /**
     * Partially updates a resource.
     *
     * @param resourceDTO the entity to update partially.
     * @return the persisted entity.
     */
    Optional<ResourceDTO> partialUpdate(ResourceDTO resourceDTO);

    /**
     * Get all the resources.
     *
     * @return the list of entities.
     */
    List<ResourceDTO> findAll();

    /**
     * Get the "id" resource.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<ResourceDTO> findOne(Long id);

    /**
     * Delete the "id" resource.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);

    /**
     * Search for the resource corresponding to the query.
     *
     * @param query the query of the search.
     * @return the list of entities.
     */
    List<ResourceDTO> search(String query);
}

package com.learnwithhamster.service.service;

import com.learnwithhamster.service.service.dto.ProgramDTO;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service Interface for managing {@link com.learnwithhamster.service.domain.Program}.
 */
public interface ProgramService {
    /**
     * Save a program.
     *
     * @param programDTO the entity to save.
     * @return the persisted entity.
     */
    ProgramDTO save(ProgramDTO programDTO);

    /**
     * Updates a program.
     *
     * @param programDTO the entity to update.
     * @return the persisted entity.
     */
    ProgramDTO update(ProgramDTO programDTO);

    /**
     * Partially updates a program.
     *
     * @param programDTO the entity to update partially.
     * @return the persisted entity.
     */
    Optional<ProgramDTO> partialUpdate(ProgramDTO programDTO);

    /**
     * Get all the programs.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<ProgramDTO> findAll(Pageable pageable);

    /**
     * Get all the programs with eager load of many-to-many relationships.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<ProgramDTO> findAllWithEagerRelationships(Pageable pageable);

    /**
     * Get the "id" program.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<ProgramDTO> findOne(Long id);

    /**
     * Delete the "id" program.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);

    /**
     * Search for the program corresponding to the query.
     *
     * @param query the query of the search.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<ProgramDTO> search(String query, Pageable pageable);
}

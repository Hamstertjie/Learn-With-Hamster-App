package com.learnwithhamster.service.service;

import com.learnwithhamster.service.service.dto.DisciplineDTO;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service Interface for managing {@link com.learnwithhamster.service.domain.Discipline}.
 */
public interface DisciplineService {
    /**
     * Save a discipline.
     *
     * @param disciplineDTO the entity to save.
     * @return the persisted entity.
     */
    DisciplineDTO save(DisciplineDTO disciplineDTO);

    /**
     * Updates a discipline.
     *
     * @param disciplineDTO the entity to update.
     * @return the persisted entity.
     */
    DisciplineDTO update(DisciplineDTO disciplineDTO);

    /**
     * Partially updates a discipline.
     *
     * @param disciplineDTO the entity to update partially.
     * @return the persisted entity.
     */
    Optional<DisciplineDTO> partialUpdate(DisciplineDTO disciplineDTO);

    /**
     * Get all the disciplines.
     *
     * @return the list of entities.
     */
    List<DisciplineDTO> findAll();

    /**
     * Get all the disciplines with eager load of many-to-many relationships.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<DisciplineDTO> findAllWithEagerRelationships(Pageable pageable);

    /**
     * Get the "id" discipline.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<DisciplineDTO> findOne(Long id);

    /**
     * Delete the "id" discipline.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);

    /**
     * Search for the discipline corresponding to the query.
     *
     * @param query the query of the search.
     * @return the list of entities.
     */
    List<DisciplineDTO> search(String query);
}

package com.learnwithhamster.service.service;

import com.learnwithhamster.service.service.dto.LessonDTO;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service Interface for managing {@link com.learnwithhamster.service.domain.Lesson}.
 */
public interface LessonService {
    /**
     * Save a lesson.
     *
     * @param lessonDTO the entity to save.
     * @return the persisted entity.
     */
    LessonDTO save(LessonDTO lessonDTO);

    /**
     * Updates a lesson.
     *
     * @param lessonDTO the entity to update.
     * @return the persisted entity.
     */
    LessonDTO update(LessonDTO lessonDTO);

    /**
     * Partially updates a lesson.
     *
     * @param lessonDTO the entity to update partially.
     * @return the persisted entity.
     */
    Optional<LessonDTO> partialUpdate(LessonDTO lessonDTO);

    /**
     * Get all the lessons.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<LessonDTO> findAll(Pageable pageable);

    /**
     * Get the "id" lesson.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<LessonDTO> findOne(Long id);

    /**
     * Delete the "id" lesson.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);

    /**
     * Search for the lesson corresponding to the query.
     *
     * @param query the query of the search.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<LessonDTO> search(String query, Pageable pageable);
}

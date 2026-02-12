package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.Lesson;
import com.learnwithhamster.service.repository.LessonRepository;
import com.learnwithhamster.service.repository.search.LessonSearchRepository;
import com.learnwithhamster.service.service.LessonService;
import com.learnwithhamster.service.service.dto.LessonDTO;
import com.learnwithhamster.service.service.mapper.LessonMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.Lesson}.
 */
@Service
@Transactional
public class LessonServiceImpl implements LessonService {

    private static final Logger LOG = LoggerFactory.getLogger(LessonServiceImpl.class);

    private final LessonRepository lessonRepository;

    private final LessonMapper lessonMapper;

    private final LessonSearchRepository lessonSearchRepository;

    public LessonServiceImpl(LessonRepository lessonRepository, LessonMapper lessonMapper, LessonSearchRepository lessonSearchRepository) {
        this.lessonRepository = lessonRepository;
        this.lessonMapper = lessonMapper;
        this.lessonSearchRepository = lessonSearchRepository;
    }

    @Override
    public LessonDTO save(LessonDTO lessonDTO) {
        LOG.debug("Request to save Lesson : {}", lessonDTO);
        Lesson lesson = lessonMapper.toEntity(lessonDTO);
        lesson = lessonRepository.save(lesson);
        lessonSearchRepository.index(lesson);
        return lessonMapper.toDto(lesson);
    }

    @Override
    public LessonDTO update(LessonDTO lessonDTO) {
        LOG.debug("Request to update Lesson : {}", lessonDTO);
        Lesson lesson = lessonMapper.toEntity(lessonDTO);
        lesson = lessonRepository.save(lesson);
        lessonSearchRepository.index(lesson);
        return lessonMapper.toDto(lesson);
    }

    @Override
    public Optional<LessonDTO> partialUpdate(LessonDTO lessonDTO) {
        LOG.debug("Request to partially update Lesson : {}", lessonDTO);

        return lessonRepository
            .findById(lessonDTO.getId())
            .map(existingLesson -> {
                lessonMapper.partialUpdate(existingLesson, lessonDTO);

                return existingLesson;
            })
            .map(lessonRepository::save)
            .map(savedLesson -> {
                lessonSearchRepository.index(savedLesson);
                return savedLesson;
            })
            .map(lessonMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LessonDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Lessons");
        return lessonRepository.findAll(pageable).map(lessonMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LessonDTO> findOne(Long id) {
        LOG.debug("Request to get Lesson : {}", id);
        return lessonRepository.findById(id).map(lessonMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Lesson : {}", id);
        lessonRepository.deleteById(id);
        lessonSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LessonDTO> search(String query, Pageable pageable) {
        LOG.debug("Request to search for a page of Lessons for query {}", query);
        return lessonSearchRepository.search(query, pageable).map(lessonMapper::toDto);
    }
}

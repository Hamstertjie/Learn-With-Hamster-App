package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.Course;
import com.learnwithhamster.service.repository.CourseRepository;
import com.learnwithhamster.service.repository.search.CourseSearchRepository;
import com.learnwithhamster.service.service.CourseService;
import com.learnwithhamster.service.service.dto.CourseDTO;
import com.learnwithhamster.service.service.mapper.CourseMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.Course}.
 */
@Service
@Transactional
public class CourseServiceImpl implements CourseService {

    private static final Logger LOG = LoggerFactory.getLogger(CourseServiceImpl.class);

    private final CourseRepository courseRepository;

    private final CourseMapper courseMapper;

    private final CourseSearchRepository courseSearchRepository;

    public CourseServiceImpl(CourseRepository courseRepository, CourseMapper courseMapper, CourseSearchRepository courseSearchRepository) {
        this.courseRepository = courseRepository;
        this.courseMapper = courseMapper;
        this.courseSearchRepository = courseSearchRepository;
    }

    @Override
    public CourseDTO save(CourseDTO courseDTO) {
        LOG.debug("Request to save Course : {}", courseDTO);
        Course course = courseMapper.toEntity(courseDTO);
        course = courseRepository.save(course);
        courseSearchRepository.index(course);
        return courseMapper.toDto(course);
    }

    @Override
    public CourseDTO update(CourseDTO courseDTO) {
        LOG.debug("Request to update Course : {}", courseDTO);
        Course course = courseMapper.toEntity(courseDTO);
        course = courseRepository.save(course);
        courseSearchRepository.index(course);
        return courseMapper.toDto(course);
    }

    @Override
    public Optional<CourseDTO> partialUpdate(CourseDTO courseDTO) {
        LOG.debug("Request to partially update Course : {}", courseDTO);

        return courseRepository
            .findById(courseDTO.getId())
            .map(existingCourse -> {
                courseMapper.partialUpdate(existingCourse, courseDTO);

                return existingCourse;
            })
            .map(courseRepository::save)
            .map(savedCourse -> {
                courseSearchRepository.index(savedCourse);
                return savedCourse;
            })
            .map(courseMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Courses");
        return courseRepository.findAll(pageable).map(courseMapper::toDto);
    }

    public Page<CourseDTO> findAllWithEagerRelationships(Pageable pageable) {
        return courseRepository.findAllWithEagerRelationships(pageable).map(courseMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CourseDTO> findOne(Long id) {
        LOG.debug("Request to get Course : {}", id);
        return courseRepository.findOneWithEagerRelationships(id).map(courseMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Course : {}", id);
        courseRepository.deleteById(id);
        courseSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseDTO> search(String query, Pageable pageable) {
        LOG.debug("Request to search for a page of Courses for query {}", query);
        return courseSearchRepository.search(query, pageable).map(courseMapper::toDto);
    }
}

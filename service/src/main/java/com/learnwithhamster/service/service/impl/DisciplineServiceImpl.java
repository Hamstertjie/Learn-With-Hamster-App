package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.Discipline;
import com.learnwithhamster.service.repository.DisciplineRepository;
import com.learnwithhamster.service.repository.search.DisciplineSearchRepository;
import com.learnwithhamster.service.service.DisciplineService;
import com.learnwithhamster.service.service.dto.DisciplineDTO;
import com.learnwithhamster.service.service.mapper.DisciplineMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.Discipline}.
 */
@Service
@Transactional
public class DisciplineServiceImpl implements DisciplineService {

    private static final Logger LOG = LoggerFactory.getLogger(DisciplineServiceImpl.class);

    private final DisciplineRepository disciplineRepository;

    private final DisciplineMapper disciplineMapper;

    private final DisciplineSearchRepository disciplineSearchRepository;

    public DisciplineServiceImpl(
        DisciplineRepository disciplineRepository,
        DisciplineMapper disciplineMapper,
        DisciplineSearchRepository disciplineSearchRepository
    ) {
        this.disciplineRepository = disciplineRepository;
        this.disciplineMapper = disciplineMapper;
        this.disciplineSearchRepository = disciplineSearchRepository;
    }

    @Override
    public DisciplineDTO save(DisciplineDTO disciplineDTO) {
        LOG.debug("Request to save Discipline : {}", disciplineDTO);
        Discipline discipline = disciplineMapper.toEntity(disciplineDTO);
        discipline = disciplineRepository.save(discipline);
        disciplineSearchRepository.index(discipline);
        return disciplineMapper.toDto(discipline);
    }

    @Override
    public DisciplineDTO update(DisciplineDTO disciplineDTO) {
        LOG.debug("Request to update Discipline : {}", disciplineDTO);
        Discipline discipline = disciplineMapper.toEntity(disciplineDTO);
        discipline = disciplineRepository.save(discipline);
        disciplineSearchRepository.index(discipline);
        return disciplineMapper.toDto(discipline);
    }

    @Override
    public Optional<DisciplineDTO> partialUpdate(DisciplineDTO disciplineDTO) {
        LOG.debug("Request to partially update Discipline : {}", disciplineDTO);

        return disciplineRepository
            .findById(disciplineDTO.getId())
            .map(existingDiscipline -> {
                disciplineMapper.partialUpdate(existingDiscipline, disciplineDTO);

                return existingDiscipline;
            })
            .map(disciplineRepository::save)
            .map(savedDiscipline -> {
                disciplineSearchRepository.index(savedDiscipline);
                return savedDiscipline;
            })
            .map(disciplineMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisciplineDTO> findAll() {
        LOG.debug("Request to get all Disciplines");
        return disciplineRepository.findAll().stream().map(disciplineMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    public Page<DisciplineDTO> findAllWithEagerRelationships(Pageable pageable) {
        return disciplineRepository.findAllWithEagerRelationships(pageable).map(disciplineMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DisciplineDTO> findOne(Long id) {
        LOG.debug("Request to get Discipline : {}", id);
        return disciplineRepository.findOneWithEagerRelationships(id).map(disciplineMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Discipline : {}", id);
        disciplineRepository.deleteById(id);
        disciplineSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisciplineDTO> search(String query) {
        LOG.debug("Request to search Disciplines for query {}", query);
        try {
            return StreamSupport.stream(disciplineSearchRepository.search(query).spliterator(), false)
                .map(disciplineMapper::toDto)
                .toList();
        } catch (RuntimeException e) {
            throw e;
        }
    }
}

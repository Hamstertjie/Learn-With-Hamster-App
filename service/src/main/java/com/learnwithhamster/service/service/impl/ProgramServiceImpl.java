package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.repository.ProgramRepository;
import com.learnwithhamster.service.repository.search.ProgramSearchRepository;
import com.learnwithhamster.service.service.ProgramService;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import com.learnwithhamster.service.service.mapper.ProgramMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.Program}.
 */
@Service
@Transactional
public class ProgramServiceImpl implements ProgramService {

    private static final Logger LOG = LoggerFactory.getLogger(ProgramServiceImpl.class);

    private final ProgramRepository programRepository;

    private final ProgramMapper programMapper;

    private final ProgramSearchRepository programSearchRepository;

    public ProgramServiceImpl(
        ProgramRepository programRepository,
        ProgramMapper programMapper,
        ProgramSearchRepository programSearchRepository
    ) {
        this.programRepository = programRepository;
        this.programMapper = programMapper;
        this.programSearchRepository = programSearchRepository;
    }

    @Override
    public ProgramDTO save(ProgramDTO programDTO) {
        LOG.debug("Request to save Program : {}", programDTO);
        Program program = programMapper.toEntity(programDTO);
        program = programRepository.save(program);
        programSearchRepository.index(program);
        return programMapper.toDto(program);
    }

    @Override
    public ProgramDTO update(ProgramDTO programDTO) {
        LOG.debug("Request to update Program : {}", programDTO);
        Program program = programMapper.toEntity(programDTO);
        program = programRepository.save(program);
        programSearchRepository.index(program);
        return programMapper.toDto(program);
    }

    @Override
    public Optional<ProgramDTO> partialUpdate(ProgramDTO programDTO) {
        LOG.debug("Request to partially update Program : {}", programDTO);

        return programRepository
            .findById(programDTO.getId())
            .map(existingProgram -> {
                programMapper.partialUpdate(existingProgram, programDTO);

                return existingProgram;
            })
            .map(programRepository::save)
            .map(savedProgram -> {
                programSearchRepository.index(savedProgram);
                return savedProgram;
            })
            .map(programMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProgramDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Programs");
        return programRepository.findAll(pageable).map(programMapper::toDto);
    }

    public Page<ProgramDTO> findAllWithEagerRelationships(Pageable pageable) {
        return programRepository.findAllWithEagerRelationships(pageable).map(programMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProgramDTO> findOne(Long id) {
        LOG.debug("Request to get Program : {}", id);
        return programRepository.findOneWithEagerRelationships(id).map(programMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Program : {}", id);
        programRepository.deleteById(id);
        programSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProgramDTO> search(String query, Pageable pageable) {
        LOG.debug("Request to search for a page of Programs for query {}", query);
        return programSearchRepository.search(query, pageable).map(programMapper::toDto);
    }
}

package com.learnwithhamster.service.web.rest;

import com.learnwithhamster.service.repository.ProgramRepository;
import com.learnwithhamster.service.service.ProgramService;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import com.learnwithhamster.service.web.rest.errors.BadRequestAlertException;
import com.learnwithhamster.service.web.rest.errors.ElasticsearchExceptionMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.learnwithhamster.service.domain.Program}.
 */
@RestController
@RequestMapping("/api/programs")
public class ProgramResource {

    private static final Logger LOG = LoggerFactory.getLogger(ProgramResource.class);

    private static final String ENTITY_NAME = "serviceProgram";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ProgramService programService;

    private final ProgramRepository programRepository;

    public ProgramResource(ProgramService programService, ProgramRepository programRepository) {
        this.programService = programService;
        this.programRepository = programRepository;
    }

    /**
     * {@code POST  /programs} : Create a new program.
     *
     * @param programDTO the programDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new programDTO, or with status {@code 400 (Bad Request)} if the program has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ProgramDTO> createProgram(@Valid @RequestBody ProgramDTO programDTO) throws URISyntaxException {
        LOG.debug("REST request to save Program : {}", programDTO);
        if (programDTO.getId() != null) {
            throw new BadRequestAlertException("A new program cannot already have an ID", ENTITY_NAME, "idexists");
        }
        programDTO = programService.save(programDTO);
        return ResponseEntity.created(new URI("/api/programs/" + programDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, programDTO.getId().toString()))
            .body(programDTO);
    }

    /**
     * {@code PUT  /programs/:id} : Updates an existing program.
     *
     * @param id the id of the programDTO to save.
     * @param programDTO the programDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated programDTO,
     * or with status {@code 400 (Bad Request)} if the programDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the programDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProgramDTO> updateProgram(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody ProgramDTO programDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Program : {}, {}", id, programDTO);
        if (programDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, programDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!programRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        programDTO = programService.update(programDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, programDTO.getId().toString()))
            .body(programDTO);
    }

    /**
     * {@code PATCH  /programs/:id} : Partial updates given fields of an existing program, field will ignore if it is null
     *
     * @param id the id of the programDTO to save.
     * @param programDTO the programDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated programDTO,
     * or with status {@code 400 (Bad Request)} if the programDTO is not valid,
     * or with status {@code 404 (Not Found)} if the programDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the programDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ProgramDTO> partialUpdateProgram(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody ProgramDTO programDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Program partially : {}, {}", id, programDTO);
        if (programDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, programDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!programRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ProgramDTO> result = programService.partialUpdate(programDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, programDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /programs} : get all the programs.
     *
     * @param pageable the pagination information.
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of programs in body.
     */
    @GetMapping("")
    public ResponseEntity<List<ProgramDTO>> getAllPrograms(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get a page of Programs");
        Page<ProgramDTO> page;
        if (eagerload) {
            page = programService.findAllWithEagerRelationships(pageable);
        } else {
            page = programService.findAll(pageable);
        }
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /programs/:id} : get the "id" program.
     *
     * @param id the id of the programDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the programDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProgramDTO> getProgram(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Program : {}", id);
        Optional<ProgramDTO> programDTO = programService.findOne(id);
        return ResponseUtil.wrapOrNotFound(programDTO);
    }

    /**
     * {@code DELETE  /programs/:id} : delete the "id" program.
     *
     * @param id the id of the programDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgram(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Program : {}", id);
        programService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code SEARCH  /programs/_search?query=:query} : search for the program corresponding
     * to the query.
     *
     * @param query the query of the program search.
     * @param pageable the pagination information.
     * @return the result of the search.
     */
    @GetMapping("/_search")
    public ResponseEntity<List<ProgramDTO>> searchPrograms(
        @RequestParam("query") String query,
        @org.springdoc.core.annotations.ParameterObject Pageable pageable
    ) {
        LOG.debug("REST request to search for a page of Programs for query {}", query);
        try {
            Page<ProgramDTO> page = programService.search(query, pageable);
            HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
            return ResponseEntity.ok().headers(headers).body(page.getContent());
        } catch (RuntimeException e) {
            throw ElasticsearchExceptionMapper.mapException(e);
        }
    }
}

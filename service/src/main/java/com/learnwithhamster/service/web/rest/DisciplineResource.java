package com.learnwithhamster.service.web.rest;

import com.learnwithhamster.service.repository.DisciplineRepository;
import com.learnwithhamster.service.service.DisciplineService;
import com.learnwithhamster.service.service.dto.DisciplineDTO;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.learnwithhamster.service.domain.Discipline}.
 */
@RestController
@RequestMapping("/api/disciplines")
public class DisciplineResource {

    private static final Logger LOG = LoggerFactory.getLogger(DisciplineResource.class);

    private static final String ENTITY_NAME = "serviceDiscipline";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final DisciplineService disciplineService;

    private final DisciplineRepository disciplineRepository;

    public DisciplineResource(DisciplineService disciplineService, DisciplineRepository disciplineRepository) {
        this.disciplineService = disciplineService;
        this.disciplineRepository = disciplineRepository;
    }

    /**
     * {@code POST  /disciplines} : Create a new discipline.
     *
     * @param disciplineDTO the disciplineDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new disciplineDTO, or with status {@code 400 (Bad Request)} if the discipline has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<DisciplineDTO> createDiscipline(@Valid @RequestBody DisciplineDTO disciplineDTO) throws URISyntaxException {
        LOG.debug("REST request to save Discipline : {}", disciplineDTO);
        if (disciplineDTO.getId() != null) {
            throw new BadRequestAlertException("A new discipline cannot already have an ID", ENTITY_NAME, "idexists");
        }
        disciplineDTO = disciplineService.save(disciplineDTO);
        return ResponseEntity.created(new URI("/api/disciplines/" + disciplineDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, disciplineDTO.getId().toString()))
            .body(disciplineDTO);
    }

    /**
     * {@code PUT  /disciplines/:id} : Updates an existing discipline.
     *
     * @param id the id of the disciplineDTO to save.
     * @param disciplineDTO the disciplineDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated disciplineDTO,
     * or with status {@code 400 (Bad Request)} if the disciplineDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the disciplineDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<DisciplineDTO> updateDiscipline(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody DisciplineDTO disciplineDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Discipline : {}, {}", id, disciplineDTO);
        if (disciplineDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, disciplineDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!disciplineRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        disciplineDTO = disciplineService.update(disciplineDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, disciplineDTO.getId().toString()))
            .body(disciplineDTO);
    }

    /**
     * {@code PATCH  /disciplines/:id} : Partial updates given fields of an existing discipline, field will ignore if it is null
     *
     * @param id the id of the disciplineDTO to save.
     * @param disciplineDTO the disciplineDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated disciplineDTO,
     * or with status {@code 400 (Bad Request)} if the disciplineDTO is not valid,
     * or with status {@code 404 (Not Found)} if the disciplineDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the disciplineDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<DisciplineDTO> partialUpdateDiscipline(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody DisciplineDTO disciplineDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Discipline partially : {}, {}", id, disciplineDTO);
        if (disciplineDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, disciplineDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!disciplineRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<DisciplineDTO> result = disciplineService.partialUpdate(disciplineDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, disciplineDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /disciplines} : get all the disciplines.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of disciplines in body.
     */
    @GetMapping("")
    public List<DisciplineDTO> getAllDisciplines(
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get all Disciplines");
        return disciplineService.findAll();
    }

    /**
     * {@code GET  /disciplines/:id} : get the "id" discipline.
     *
     * @param id the id of the disciplineDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the disciplineDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DisciplineDTO> getDiscipline(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Discipline : {}", id);
        Optional<DisciplineDTO> disciplineDTO = disciplineService.findOne(id);
        return ResponseUtil.wrapOrNotFound(disciplineDTO);
    }

    /**
     * {@code DELETE  /disciplines/:id} : delete the "id" discipline.
     *
     * @param id the id of the disciplineDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiscipline(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Discipline : {}", id);
        disciplineService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code SEARCH  /disciplines/_search?query=:query} : search for the discipline corresponding
     * to the query.
     *
     * @param query the query of the discipline search.
     * @return the result of the search.
     */
    @GetMapping("/_search")
    public List<DisciplineDTO> searchDisciplines(@RequestParam("query") String query) {
        LOG.debug("REST request to search Disciplines for query {}", query);
        try {
            return disciplineService.search(query);
        } catch (RuntimeException e) {
            throw ElasticsearchExceptionMapper.mapException(e);
        }
    }
}

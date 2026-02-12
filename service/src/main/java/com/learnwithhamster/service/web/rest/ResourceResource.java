package com.learnwithhamster.service.web.rest;

import com.learnwithhamster.service.repository.ResourceRepository;
import com.learnwithhamster.service.service.ResourceService;
import com.learnwithhamster.service.service.dto.ResourceDTO;
import com.learnwithhamster.service.web.rest.errors.BadRequestAlertException;
import com.learnwithhamster.service.web.rest.errors.ElasticsearchExceptionMapper;
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
 * REST controller for managing {@link com.learnwithhamster.service.domain.Resource}.
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceResource {

    private static final Logger LOG = LoggerFactory.getLogger(ResourceResource.class);

    private static final String ENTITY_NAME = "serviceResource";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ResourceService resourceService;

    private final ResourceRepository resourceRepository;

    public ResourceResource(ResourceService resourceService, ResourceRepository resourceRepository) {
        this.resourceService = resourceService;
        this.resourceRepository = resourceRepository;
    }

    /**
     * {@code POST  /resources} : Create a new resource.
     *
     * @param resourceDTO the resourceDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new resourceDTO, or with status {@code 400 (Bad Request)} if the resource has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ResourceDTO> createResource(@RequestBody ResourceDTO resourceDTO) throws URISyntaxException {
        LOG.debug("REST request to save Resource : {}", resourceDTO);
        if (resourceDTO.getId() != null) {
            throw new BadRequestAlertException("A new resource cannot already have an ID", ENTITY_NAME, "idexists");
        }
        resourceDTO = resourceService.save(resourceDTO);
        return ResponseEntity.created(new URI("/api/resources/" + resourceDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, resourceDTO.getId().toString()))
            .body(resourceDTO);
    }

    /**
     * {@code PUT  /resources/:id} : Updates an existing resource.
     *
     * @param id the id of the resourceDTO to save.
     * @param resourceDTO the resourceDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated resourceDTO,
     * or with status {@code 400 (Bad Request)} if the resourceDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the resourceDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ResourceDTO> updateResource(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody ResourceDTO resourceDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Resource : {}, {}", id, resourceDTO);
        if (resourceDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, resourceDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!resourceRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        resourceDTO = resourceService.update(resourceDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, resourceDTO.getId().toString()))
            .body(resourceDTO);
    }

    /**
     * {@code PATCH  /resources/:id} : Partial updates given fields of an existing resource, field will ignore if it is null
     *
     * @param id the id of the resourceDTO to save.
     * @param resourceDTO the resourceDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated resourceDTO,
     * or with status {@code 400 (Bad Request)} if the resourceDTO is not valid,
     * or with status {@code 404 (Not Found)} if the resourceDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the resourceDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ResourceDTO> partialUpdateResource(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody ResourceDTO resourceDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Resource partially : {}, {}", id, resourceDTO);
        if (resourceDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, resourceDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!resourceRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ResourceDTO> result = resourceService.partialUpdate(resourceDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, resourceDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /resources} : get all the resources.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of resources in body.
     */
    @GetMapping("")
    public List<ResourceDTO> getAllResources() {
        LOG.debug("REST request to get all Resources");
        return resourceService.findAll();
    }

    /**
     * {@code GET  /resources/:id} : get the "id" resource.
     *
     * @param id the id of the resourceDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the resourceDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResourceDTO> getResource(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Resource : {}", id);
        Optional<ResourceDTO> resourceDTO = resourceService.findOne(id);
        return ResponseUtil.wrapOrNotFound(resourceDTO);
    }

    /**
     * {@code DELETE  /resources/:id} : delete the "id" resource.
     *
     * @param id the id of the resourceDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Resource : {}", id);
        resourceService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code SEARCH  /resources/_search?query=:query} : search for the resource corresponding
     * to the query.
     *
     * @param query the query of the resource search.
     * @return the result of the search.
     */
    @GetMapping("/_search")
    public List<ResourceDTO> searchResources(@RequestParam("query") String query) {
        LOG.debug("REST request to search Resources for query {}", query);
        try {
            return resourceService.search(query);
        } catch (RuntimeException e) {
            throw ElasticsearchExceptionMapper.mapException(e);
        }
    }
}

package com.learnwithhamster.service.web.rest;

import static com.learnwithhamster.service.domain.ResourceAsserts.*;
import static com.learnwithhamster.service.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnwithhamster.service.IntegrationTest;
import com.learnwithhamster.service.domain.Resource;
import com.learnwithhamster.service.domain.enumeration.ResourceType;
import com.learnwithhamster.service.repository.ResourceRepository;
import com.learnwithhamster.service.repository.search.ResourceSearchRepository;
import com.learnwithhamster.service.service.dto.ResourceDTO;
import com.learnwithhamster.service.service.mapper.ResourceMapper;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.assertj.core.util.IterableUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.util.Streamable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link ResourceResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class ResourceResourceIT {

    private static final String DEFAULT_RESOURCE_NAME = "AAAAAAAAAA";
    private static final String UPDATED_RESOURCE_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_RESOURCE_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_RESOURCE_DESCRIPTION = "BBBBBBBBBB";

    private static final String DEFAULT_RESOURCE_URL = "AAAAAAAAAA";
    private static final String UPDATED_RESOURCE_URL = "BBBBBBBBBB";

    private static final String DEFAULT_RESOURCE_PREVIEW_IMAGE = "AAAAAAAAAA";
    private static final String UPDATED_RESOURCE_PREVIEW_IMAGE = "BBBBBBBBBB";

    private static final ResourceType DEFAULT_RESOURCE_TYPE = ResourceType.VIDEO;
    private static final ResourceType UPDATED_RESOURCE_TYPE = ResourceType.IMAGE;

    private static final Integer DEFAULT_WEIGHT = 1;
    private static final Integer UPDATED_WEIGHT = 2;

    private static final String ENTITY_API_URL = "/api/resources";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";
    private static final String ENTITY_SEARCH_API_URL = "/api/resources/_search";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceMapper resourceMapper;

    @Autowired
    private ResourceSearchRepository resourceSearchRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restResourceMockMvc;

    private Resource resource;

    private Resource insertedResource;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Resource createEntity() {
        return new Resource()
            .resourceName(DEFAULT_RESOURCE_NAME)
            .resourceDescription(DEFAULT_RESOURCE_DESCRIPTION)
            .resourceURL(DEFAULT_RESOURCE_URL)
            .resourcePreviewImage(DEFAULT_RESOURCE_PREVIEW_IMAGE)
            .resourceType(DEFAULT_RESOURCE_TYPE)
            .weight(DEFAULT_WEIGHT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Resource createUpdatedEntity() {
        return new Resource()
            .resourceName(UPDATED_RESOURCE_NAME)
            .resourceDescription(UPDATED_RESOURCE_DESCRIPTION)
            .resourceURL(UPDATED_RESOURCE_URL)
            .resourcePreviewImage(UPDATED_RESOURCE_PREVIEW_IMAGE)
            .resourceType(UPDATED_RESOURCE_TYPE)
            .weight(UPDATED_WEIGHT);
    }

    @BeforeEach
    void initTest() {
        resource = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedResource != null) {
            resourceRepository.delete(insertedResource);
            resourceSearchRepository.delete(insertedResource);
            insertedResource = null;
        }
    }

    @Test
    @Transactional
    void createResource() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);
        var returnedResourceDTO = om.readValue(
            restResourceMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(resourceDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ResourceDTO.class
        );

        // Validate the Resource in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedResource = resourceMapper.toEntity(returnedResourceDTO);
        assertResourceUpdatableFieldsEquals(returnedResource, getPersistedResource(returnedResource));

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore + 1);
            });

        insertedResource = returnedResource;
    }

    @Test
    @Transactional
    void createResourceWithExistingId() throws Exception {
        // Create the Resource with an existing ID
        resource.setId(1L);
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());

        // An entity with an existing ID cannot be created, so this API call must fail
        restResourceMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(resourceDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void getAllResources() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);

        // Get all the resourceList
        restResourceMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(resource.getId().intValue())))
            .andExpect(jsonPath("$.[*].resourceName").value(hasItem(DEFAULT_RESOURCE_NAME)))
            .andExpect(jsonPath("$.[*].resourceDescription").value(hasItem(DEFAULT_RESOURCE_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].resourceURL").value(hasItem(DEFAULT_RESOURCE_URL)))
            .andExpect(jsonPath("$.[*].resourcePreviewImage").value(hasItem(DEFAULT_RESOURCE_PREVIEW_IMAGE)))
            .andExpect(jsonPath("$.[*].resourceType").value(hasItem(DEFAULT_RESOURCE_TYPE.toString())))
            .andExpect(jsonPath("$.[*].weight").value(hasItem(DEFAULT_WEIGHT)));
    }

    @Test
    @Transactional
    void getResource() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);

        // Get the resource
        restResourceMockMvc
            .perform(get(ENTITY_API_URL_ID, resource.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(resource.getId().intValue()))
            .andExpect(jsonPath("$.resourceName").value(DEFAULT_RESOURCE_NAME))
            .andExpect(jsonPath("$.resourceDescription").value(DEFAULT_RESOURCE_DESCRIPTION))
            .andExpect(jsonPath("$.resourceURL").value(DEFAULT_RESOURCE_URL))
            .andExpect(jsonPath("$.resourcePreviewImage").value(DEFAULT_RESOURCE_PREVIEW_IMAGE))
            .andExpect(jsonPath("$.resourceType").value(DEFAULT_RESOURCE_TYPE.toString()))
            .andExpect(jsonPath("$.weight").value(DEFAULT_WEIGHT));
    }

    @Test
    @Transactional
    void getNonExistingResource() throws Exception {
        // Get the resource
        restResourceMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingResource() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);

        long databaseSizeBeforeUpdate = getRepositoryCount();
        resourceSearchRepository.save(resource);
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());

        // Update the resource
        Resource updatedResource = resourceRepository.findById(resource.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedResource are not directly saved in db
        em.detach(updatedResource);
        updatedResource
            .resourceName(UPDATED_RESOURCE_NAME)
            .resourceDescription(UPDATED_RESOURCE_DESCRIPTION)
            .resourceURL(UPDATED_RESOURCE_URL)
            .resourcePreviewImage(UPDATED_RESOURCE_PREVIEW_IMAGE)
            .resourceType(UPDATED_RESOURCE_TYPE)
            .weight(UPDATED_WEIGHT);
        ResourceDTO resourceDTO = resourceMapper.toDto(updatedResource);

        restResourceMockMvc
            .perform(
                put(ENTITY_API_URL_ID, resourceDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(resourceDTO))
            )
            .andExpect(status().isOk());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedResourceToMatchAllProperties(updatedResource);

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
                List<Resource> resourceSearchList = Streamable.of(resourceSearchRepository.findAll()).toList();
                Resource testResourceSearch = resourceSearchList.get(searchDatabaseSizeAfter - 1);

                assertResourceAllPropertiesEquals(testResourceSearch, updatedResource);
            });
    }

    @Test
    @Transactional
    void putNonExistingResource() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        resource.setId(longCount.incrementAndGet());

        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restResourceMockMvc
            .perform(
                put(ENTITY_API_URL_ID, resourceDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(resourceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithIdMismatchResource() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        resource.setId(longCount.incrementAndGet());

        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restResourceMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(resourceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamResource() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        resource.setId(longCount.incrementAndGet());

        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restResourceMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(resourceDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void partialUpdateResourceWithPatch() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the resource using partial update
        Resource partialUpdatedResource = new Resource();
        partialUpdatedResource.setId(resource.getId());

        partialUpdatedResource
            .resourcePreviewImage(UPDATED_RESOURCE_PREVIEW_IMAGE)
            .resourceType(UPDATED_RESOURCE_TYPE)
            .weight(UPDATED_WEIGHT);

        restResourceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedResource.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedResource))
            )
            .andExpect(status().isOk());

        // Validate the Resource in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertResourceUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedResource, resource), getPersistedResource(resource));
    }

    @Test
    @Transactional
    void fullUpdateResourceWithPatch() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the resource using partial update
        Resource partialUpdatedResource = new Resource();
        partialUpdatedResource.setId(resource.getId());

        partialUpdatedResource
            .resourceName(UPDATED_RESOURCE_NAME)
            .resourceDescription(UPDATED_RESOURCE_DESCRIPTION)
            .resourceURL(UPDATED_RESOURCE_URL)
            .resourcePreviewImage(UPDATED_RESOURCE_PREVIEW_IMAGE)
            .resourceType(UPDATED_RESOURCE_TYPE)
            .weight(UPDATED_WEIGHT);

        restResourceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedResource.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedResource))
            )
            .andExpect(status().isOk());

        // Validate the Resource in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertResourceUpdatableFieldsEquals(partialUpdatedResource, getPersistedResource(partialUpdatedResource));
    }

    @Test
    @Transactional
    void patchNonExistingResource() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        resource.setId(longCount.incrementAndGet());

        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restResourceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, resourceDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(resourceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithIdMismatchResource() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        resource.setId(longCount.incrementAndGet());

        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restResourceMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(resourceDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamResource() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        resource.setId(longCount.incrementAndGet());

        // Create the Resource
        ResourceDTO resourceDTO = resourceMapper.toDto(resource);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restResourceMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(resourceDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Resource in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void deleteResource() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);
        resourceRepository.save(resource);
        resourceSearchRepository.save(resource);

        long databaseSizeBeforeDelete = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeBefore).isEqualTo(databaseSizeBeforeDelete);

        // Delete the resource
        restResourceMockMvc
            .perform(delete(ENTITY_API_URL_ID, resource.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(resourceSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore - 1);
    }

    @Test
    @Transactional
    void searchResource() throws Exception {
        // Initialize the database
        insertedResource = resourceRepository.saveAndFlush(resource);
        resourceSearchRepository.save(resource);

        // Search the resource
        restResourceMockMvc
            .perform(get(ENTITY_SEARCH_API_URL + "?query=id:" + resource.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(resource.getId().intValue())))
            .andExpect(jsonPath("$.[*].resourceName").value(hasItem(DEFAULT_RESOURCE_NAME)))
            .andExpect(jsonPath("$.[*].resourceDescription").value(hasItem(DEFAULT_RESOURCE_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].resourceURL").value(hasItem(DEFAULT_RESOURCE_URL)))
            .andExpect(jsonPath("$.[*].resourcePreviewImage").value(hasItem(DEFAULT_RESOURCE_PREVIEW_IMAGE)))
            .andExpect(jsonPath("$.[*].resourceType").value(hasItem(DEFAULT_RESOURCE_TYPE.toString())))
            .andExpect(jsonPath("$.[*].weight").value(hasItem(DEFAULT_WEIGHT)));
    }

    protected long getRepositoryCount() {
        return resourceRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Resource getPersistedResource(Resource resource) {
        return resourceRepository.findById(resource.getId()).orElseThrow();
    }

    protected void assertPersistedResourceToMatchAllProperties(Resource expectedResource) {
        assertResourceAllPropertiesEquals(expectedResource, getPersistedResource(expectedResource));
    }

    protected void assertPersistedResourceToMatchUpdatableProperties(Resource expectedResource) {
        assertResourceAllUpdatablePropertiesEquals(expectedResource, getPersistedResource(expectedResource));
    }
}

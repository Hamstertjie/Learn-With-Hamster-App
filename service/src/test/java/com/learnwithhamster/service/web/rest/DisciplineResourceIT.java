package com.learnwithhamster.service.web.rest;

import static com.learnwithhamster.service.domain.DisciplineAsserts.*;
import static com.learnwithhamster.service.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnwithhamster.service.IntegrationTest;
import com.learnwithhamster.service.domain.Discipline;
import com.learnwithhamster.service.repository.DisciplineRepository;
import com.learnwithhamster.service.repository.search.DisciplineSearchRepository;
import com.learnwithhamster.service.service.DisciplineService;
import com.learnwithhamster.service.service.dto.DisciplineDTO;
import com.learnwithhamster.service.service.mapper.DisciplineMapper;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.assertj.core.util.IterableUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.util.Streamable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link DisciplineResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class DisciplineResourceIT {

    private static final String DEFAULT_DISCIPLINE_NAME = "AAAAAAAAAA";
    private static final String UPDATED_DISCIPLINE_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_DISCIPLINE_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DISCIPLINE_DESCRIPTION = "BBBBBBBBBB";

    private static final Long DEFAULT_DISCIPLINE_PRICE = 1L;
    private static final Long UPDATED_DISCIPLINE_PRICE = 2L;

    private static final String ENTITY_API_URL = "/api/disciplines";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";
    private static final String ENTITY_SEARCH_API_URL = "/api/disciplines/_search";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private DisciplineRepository disciplineRepository;

    @Mock
    private DisciplineRepository disciplineRepositoryMock;

    @Autowired
    private DisciplineMapper disciplineMapper;

    @Mock
    private DisciplineService disciplineServiceMock;

    @Autowired
    private DisciplineSearchRepository disciplineSearchRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restDisciplineMockMvc;

    private Discipline discipline;

    private Discipline insertedDiscipline;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Discipline createEntity() {
        return new Discipline()
            .disciplineName(DEFAULT_DISCIPLINE_NAME)
            .disciplineDescription(DEFAULT_DISCIPLINE_DESCRIPTION)
            .disciplinePrice(DEFAULT_DISCIPLINE_PRICE);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Discipline createUpdatedEntity() {
        return new Discipline()
            .disciplineName(UPDATED_DISCIPLINE_NAME)
            .disciplineDescription(UPDATED_DISCIPLINE_DESCRIPTION)
            .disciplinePrice(UPDATED_DISCIPLINE_PRICE);
    }

    @BeforeEach
    void initTest() {
        discipline = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedDiscipline != null) {
            disciplineRepository.delete(insertedDiscipline);
            disciplineSearchRepository.delete(insertedDiscipline);
            insertedDiscipline = null;
        }
    }

    @Test
    @Transactional
    void createDiscipline() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);
        var returnedDisciplineDTO = om.readValue(
            restDisciplineMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(disciplineDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            DisciplineDTO.class
        );

        // Validate the Discipline in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedDiscipline = disciplineMapper.toEntity(returnedDisciplineDTO);
        assertDisciplineUpdatableFieldsEquals(returnedDiscipline, getPersistedDiscipline(returnedDiscipline));

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore + 1);
            });

        insertedDiscipline = returnedDiscipline;
    }

    @Test
    @Transactional
    void createDisciplineWithExistingId() throws Exception {
        // Create the Discipline with an existing ID
        discipline.setId(1L);
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());

        // An entity with an existing ID cannot be created, so this API call must fail
        restDisciplineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(disciplineDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkDisciplineNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        // set the field null
        discipline.setDisciplineName(null);

        // Create the Discipline, which fails.
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        restDisciplineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(disciplineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void getAllDisciplines() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);

        // Get all the disciplineList
        restDisciplineMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(discipline.getId().intValue())))
            .andExpect(jsonPath("$.[*].disciplineName").value(hasItem(DEFAULT_DISCIPLINE_NAME)))
            .andExpect(jsonPath("$.[*].disciplineDescription").value(hasItem(DEFAULT_DISCIPLINE_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].disciplinePrice").value(hasItem(DEFAULT_DISCIPLINE_PRICE.intValue())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllDisciplinesWithEagerRelationshipsIsEnabled() throws Exception {
        when(disciplineServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restDisciplineMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(disciplineServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllDisciplinesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(disciplineServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restDisciplineMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(disciplineRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getDiscipline() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);

        // Get the discipline
        restDisciplineMockMvc
            .perform(get(ENTITY_API_URL_ID, discipline.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(discipline.getId().intValue()))
            .andExpect(jsonPath("$.disciplineName").value(DEFAULT_DISCIPLINE_NAME))
            .andExpect(jsonPath("$.disciplineDescription").value(DEFAULT_DISCIPLINE_DESCRIPTION))
            .andExpect(jsonPath("$.disciplinePrice").value(DEFAULT_DISCIPLINE_PRICE.intValue()));
    }

    @Test
    @Transactional
    void getNonExistingDiscipline() throws Exception {
        // Get the discipline
        restDisciplineMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingDiscipline() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);

        long databaseSizeBeforeUpdate = getRepositoryCount();
        disciplineSearchRepository.save(discipline);
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());

        // Update the discipline
        Discipline updatedDiscipline = disciplineRepository.findById(discipline.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedDiscipline are not directly saved in db
        em.detach(updatedDiscipline);
        updatedDiscipline
            .disciplineName(UPDATED_DISCIPLINE_NAME)
            .disciplineDescription(UPDATED_DISCIPLINE_DESCRIPTION)
            .disciplinePrice(UPDATED_DISCIPLINE_PRICE);
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(updatedDiscipline);

        restDisciplineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, disciplineDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(disciplineDTO))
            )
            .andExpect(status().isOk());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedDisciplineToMatchAllProperties(updatedDiscipline);

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
                List<Discipline> disciplineSearchList = Streamable.of(disciplineSearchRepository.findAll()).toList();
                Discipline testDisciplineSearch = disciplineSearchList.get(searchDatabaseSizeAfter - 1);

                assertDisciplineAllPropertiesEquals(testDisciplineSearch, updatedDiscipline);
            });
    }

    @Test
    @Transactional
    void putNonExistingDiscipline() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        discipline.setId(longCount.incrementAndGet());

        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restDisciplineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, disciplineDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(disciplineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithIdMismatchDiscipline() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        discipline.setId(longCount.incrementAndGet());

        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDisciplineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(disciplineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamDiscipline() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        discipline.setId(longCount.incrementAndGet());

        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDisciplineMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(disciplineDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void partialUpdateDisciplineWithPatch() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the discipline using partial update
        Discipline partialUpdatedDiscipline = new Discipline();
        partialUpdatedDiscipline.setId(discipline.getId());

        partialUpdatedDiscipline.disciplinePrice(UPDATED_DISCIPLINE_PRICE);

        restDisciplineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedDiscipline.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedDiscipline))
            )
            .andExpect(status().isOk());

        // Validate the Discipline in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertDisciplineUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedDiscipline, discipline),
            getPersistedDiscipline(discipline)
        );
    }

    @Test
    @Transactional
    void fullUpdateDisciplineWithPatch() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the discipline using partial update
        Discipline partialUpdatedDiscipline = new Discipline();
        partialUpdatedDiscipline.setId(discipline.getId());

        partialUpdatedDiscipline
            .disciplineName(UPDATED_DISCIPLINE_NAME)
            .disciplineDescription(UPDATED_DISCIPLINE_DESCRIPTION)
            .disciplinePrice(UPDATED_DISCIPLINE_PRICE);

        restDisciplineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedDiscipline.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedDiscipline))
            )
            .andExpect(status().isOk());

        // Validate the Discipline in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertDisciplineUpdatableFieldsEquals(partialUpdatedDiscipline, getPersistedDiscipline(partialUpdatedDiscipline));
    }

    @Test
    @Transactional
    void patchNonExistingDiscipline() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        discipline.setId(longCount.incrementAndGet());

        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restDisciplineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, disciplineDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(disciplineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithIdMismatchDiscipline() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        discipline.setId(longCount.incrementAndGet());

        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDisciplineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(disciplineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamDiscipline() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        discipline.setId(longCount.incrementAndGet());

        // Create the Discipline
        DisciplineDTO disciplineDTO = disciplineMapper.toDto(discipline);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDisciplineMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(disciplineDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Discipline in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void deleteDiscipline() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);
        disciplineRepository.save(discipline);
        disciplineSearchRepository.save(discipline);

        long databaseSizeBeforeDelete = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeBefore).isEqualTo(databaseSizeBeforeDelete);

        // Delete the discipline
        restDisciplineMockMvc
            .perform(delete(ENTITY_API_URL_ID, discipline.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(disciplineSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore - 1);
    }

    @Test
    @Transactional
    void searchDiscipline() throws Exception {
        // Initialize the database
        insertedDiscipline = disciplineRepository.saveAndFlush(discipline);
        disciplineSearchRepository.save(discipline);

        // Search the discipline
        restDisciplineMockMvc
            .perform(get(ENTITY_SEARCH_API_URL + "?query=id:" + discipline.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(discipline.getId().intValue())))
            .andExpect(jsonPath("$.[*].disciplineName").value(hasItem(DEFAULT_DISCIPLINE_NAME)))
            .andExpect(jsonPath("$.[*].disciplineDescription").value(hasItem(DEFAULT_DISCIPLINE_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].disciplinePrice").value(hasItem(DEFAULT_DISCIPLINE_PRICE.intValue())));
    }

    protected long getRepositoryCount() {
        return disciplineRepository.count();
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

    protected Discipline getPersistedDiscipline(Discipline discipline) {
        return disciplineRepository.findById(discipline.getId()).orElseThrow();
    }

    protected void assertPersistedDisciplineToMatchAllProperties(Discipline expectedDiscipline) {
        assertDisciplineAllPropertiesEquals(expectedDiscipline, getPersistedDiscipline(expectedDiscipline));
    }

    protected void assertPersistedDisciplineToMatchUpdatableProperties(Discipline expectedDiscipline) {
        assertDisciplineAllUpdatablePropertiesEquals(expectedDiscipline, getPersistedDiscipline(expectedDiscipline));
    }
}

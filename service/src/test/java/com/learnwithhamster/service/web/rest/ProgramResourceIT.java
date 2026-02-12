package com.learnwithhamster.service.web.rest;

import static com.learnwithhamster.service.domain.ProgramAsserts.*;
import static com.learnwithhamster.service.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnwithhamster.service.IntegrationTest;
import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.repository.ProgramRepository;
import com.learnwithhamster.service.repository.search.ProgramSearchRepository;
import com.learnwithhamster.service.service.ProgramService;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import com.learnwithhamster.service.service.mapper.ProgramMapper;
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
 * Integration tests for the {@link ProgramResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class ProgramResourceIT {

    private static final String DEFAULT_PROGRAM_NAME = "AAAAAAAAAA";
    private static final String UPDATED_PROGRAM_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_PROGRAM_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_PROGRAM_DESCRIPTION = "BBBBBBBBBB";

    private static final Long DEFAULT_PROGRAM_PRICE = 1L;
    private static final Long UPDATED_PROGRAM_PRICE = 2L;

    private static final String ENTITY_API_URL = "/api/programs";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";
    private static final String ENTITY_SEARCH_API_URL = "/api/programs/_search";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ProgramRepository programRepository;

    @Mock
    private ProgramRepository programRepositoryMock;

    @Autowired
    private ProgramMapper programMapper;

    @Mock
    private ProgramService programServiceMock;

    @Autowired
    private ProgramSearchRepository programSearchRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restProgramMockMvc;

    private Program program;

    private Program insertedProgram;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Program createEntity() {
        return new Program()
            .programName(DEFAULT_PROGRAM_NAME)
            .programDescription(DEFAULT_PROGRAM_DESCRIPTION)
            .programPrice(DEFAULT_PROGRAM_PRICE);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Program createUpdatedEntity() {
        return new Program()
            .programName(UPDATED_PROGRAM_NAME)
            .programDescription(UPDATED_PROGRAM_DESCRIPTION)
            .programPrice(UPDATED_PROGRAM_PRICE);
    }

    @BeforeEach
    void initTest() {
        program = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedProgram != null) {
            programRepository.delete(insertedProgram);
            programSearchRepository.delete(insertedProgram);
            insertedProgram = null;
        }
    }

    @Test
    @Transactional
    void createProgram() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);
        var returnedProgramDTO = om.readValue(
            restProgramMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(programDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ProgramDTO.class
        );

        // Validate the Program in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedProgram = programMapper.toEntity(returnedProgramDTO);
        assertProgramUpdatableFieldsEquals(returnedProgram, getPersistedProgram(returnedProgram));

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore + 1);
            });

        insertedProgram = returnedProgram;
    }

    @Test
    @Transactional
    void createProgramWithExistingId() throws Exception {
        // Create the Program with an existing ID
        program.setId(1L);
        ProgramDTO programDTO = programMapper.toDto(program);

        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());

        // An entity with an existing ID cannot be created, so this API call must fail
        restProgramMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(programDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkProgramNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        // set the field null
        program.setProgramName(null);

        // Create the Program, which fails.
        ProgramDTO programDTO = programMapper.toDto(program);

        restProgramMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(programDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void getAllPrograms() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);

        // Get all the programList
        restProgramMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(program.getId().intValue())))
            .andExpect(jsonPath("$.[*].programName").value(hasItem(DEFAULT_PROGRAM_NAME)))
            .andExpect(jsonPath("$.[*].programDescription").value(hasItem(DEFAULT_PROGRAM_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].programPrice").value(hasItem(DEFAULT_PROGRAM_PRICE.intValue())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllProgramsWithEagerRelationshipsIsEnabled() throws Exception {
        when(programServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restProgramMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(programServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllProgramsWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(programServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restProgramMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(programRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getProgram() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);

        // Get the program
        restProgramMockMvc
            .perform(get(ENTITY_API_URL_ID, program.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(program.getId().intValue()))
            .andExpect(jsonPath("$.programName").value(DEFAULT_PROGRAM_NAME))
            .andExpect(jsonPath("$.programDescription").value(DEFAULT_PROGRAM_DESCRIPTION))
            .andExpect(jsonPath("$.programPrice").value(DEFAULT_PROGRAM_PRICE.intValue()));
    }

    @Test
    @Transactional
    void getNonExistingProgram() throws Exception {
        // Get the program
        restProgramMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingProgram() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);

        long databaseSizeBeforeUpdate = getRepositoryCount();
        programSearchRepository.save(program);
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());

        // Update the program
        Program updatedProgram = programRepository.findById(program.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedProgram are not directly saved in db
        em.detach(updatedProgram);
        updatedProgram
            .programName(UPDATED_PROGRAM_NAME)
            .programDescription(UPDATED_PROGRAM_DESCRIPTION)
            .programPrice(UPDATED_PROGRAM_PRICE);
        ProgramDTO programDTO = programMapper.toDto(updatedProgram);

        restProgramMockMvc
            .perform(
                put(ENTITY_API_URL_ID, programDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(programDTO))
            )
            .andExpect(status().isOk());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedProgramToMatchAllProperties(updatedProgram);

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
                List<Program> programSearchList = Streamable.of(programSearchRepository.findAll()).toList();
                Program testProgramSearch = programSearchList.get(searchDatabaseSizeAfter - 1);

                assertProgramAllPropertiesEquals(testProgramSearch, updatedProgram);
            });
    }

    @Test
    @Transactional
    void putNonExistingProgram() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        program.setId(longCount.incrementAndGet());

        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restProgramMockMvc
            .perform(
                put(ENTITY_API_URL_ID, programDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(programDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithIdMismatchProgram() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        program.setId(longCount.incrementAndGet());

        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgramMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(programDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamProgram() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        program.setId(longCount.incrementAndGet());

        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgramMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(programDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void partialUpdateProgramWithPatch() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the program using partial update
        Program partialUpdatedProgram = new Program();
        partialUpdatedProgram.setId(program.getId());

        partialUpdatedProgram.programName(UPDATED_PROGRAM_NAME).programPrice(UPDATED_PROGRAM_PRICE);

        restProgramMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedProgram.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedProgram))
            )
            .andExpect(status().isOk());

        // Validate the Program in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertProgramUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedProgram, program), getPersistedProgram(program));
    }

    @Test
    @Transactional
    void fullUpdateProgramWithPatch() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the program using partial update
        Program partialUpdatedProgram = new Program();
        partialUpdatedProgram.setId(program.getId());

        partialUpdatedProgram
            .programName(UPDATED_PROGRAM_NAME)
            .programDescription(UPDATED_PROGRAM_DESCRIPTION)
            .programPrice(UPDATED_PROGRAM_PRICE);

        restProgramMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedProgram.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedProgram))
            )
            .andExpect(status().isOk());

        // Validate the Program in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertProgramUpdatableFieldsEquals(partialUpdatedProgram, getPersistedProgram(partialUpdatedProgram));
    }

    @Test
    @Transactional
    void patchNonExistingProgram() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        program.setId(longCount.incrementAndGet());

        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restProgramMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, programDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(programDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithIdMismatchProgram() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        program.setId(longCount.incrementAndGet());

        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgramMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(programDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamProgram() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        program.setId(longCount.incrementAndGet());

        // Create the Program
        ProgramDTO programDTO = programMapper.toDto(program);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgramMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(programDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Program in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void deleteProgram() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);
        programRepository.save(program);
        programSearchRepository.save(program);

        long databaseSizeBeforeDelete = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeBefore).isEqualTo(databaseSizeBeforeDelete);

        // Delete the program
        restProgramMockMvc
            .perform(delete(ENTITY_API_URL_ID, program.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(programSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore - 1);
    }

    @Test
    @Transactional
    void searchProgram() throws Exception {
        // Initialize the database
        insertedProgram = programRepository.saveAndFlush(program);
        programSearchRepository.save(program);

        // Search the program
        restProgramMockMvc
            .perform(get(ENTITY_SEARCH_API_URL + "?query=id:" + program.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(program.getId().intValue())))
            .andExpect(jsonPath("$.[*].programName").value(hasItem(DEFAULT_PROGRAM_NAME)))
            .andExpect(jsonPath("$.[*].programDescription").value(hasItem(DEFAULT_PROGRAM_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].programPrice").value(hasItem(DEFAULT_PROGRAM_PRICE.intValue())));
    }

    protected long getRepositoryCount() {
        return programRepository.count();
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

    protected Program getPersistedProgram(Program program) {
        return programRepository.findById(program.getId()).orElseThrow();
    }

    protected void assertPersistedProgramToMatchAllProperties(Program expectedProgram) {
        assertProgramAllPropertiesEquals(expectedProgram, getPersistedProgram(expectedProgram));
    }

    protected void assertPersistedProgramToMatchUpdatableProperties(Program expectedProgram) {
        assertProgramAllUpdatablePropertiesEquals(expectedProgram, getPersistedProgram(expectedProgram));
    }
}

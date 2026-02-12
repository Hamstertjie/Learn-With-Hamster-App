package com.learnwithhamster.service.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnwithhamster.service.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class DisciplineDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(DisciplineDTO.class);
        DisciplineDTO disciplineDTO1 = new DisciplineDTO();
        disciplineDTO1.setId(1L);
        DisciplineDTO disciplineDTO2 = new DisciplineDTO();
        assertThat(disciplineDTO1).isNotEqualTo(disciplineDTO2);
        disciplineDTO2.setId(disciplineDTO1.getId());
        assertThat(disciplineDTO1).isEqualTo(disciplineDTO2);
        disciplineDTO2.setId(2L);
        assertThat(disciplineDTO1).isNotEqualTo(disciplineDTO2);
        disciplineDTO1.setId(null);
        assertThat(disciplineDTO1).isNotEqualTo(disciplineDTO2);
    }
}

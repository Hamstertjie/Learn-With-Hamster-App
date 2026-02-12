package com.learnwithhamster.service.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.repository.ProgramRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Program} entity.
 */
public interface ProgramSearchRepository extends ElasticsearchRepository<Program, Long>, ProgramSearchRepositoryInternal {}

interface ProgramSearchRepositoryInternal {
    Page<Program> search(String query, Pageable pageable);

    Page<Program> search(Query query);

    @Async
    void index(Program entity);

    @Async
    void deleteFromIndexById(Long id);
}

class ProgramSearchRepositoryInternalImpl implements ProgramSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final ProgramRepository repository;

    ProgramSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, ProgramRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Page<Program> search(String query, Pageable pageable) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery.setPageable(pageable));
    }

    @Override
    public Page<Program> search(Query query) {
        SearchHits<Program> searchHits = elasticsearchTemplate.search(query, Program.class);
        List<Program> hits = searchHits.map(SearchHit::getContent).stream().toList();
        return new PageImpl<>(hits, query.getPageable(), searchHits.getTotalHits());
    }

    @Override
    public void index(Program entity) {
        repository.findOneWithEagerRelationships(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Program.class);
    }
}

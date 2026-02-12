package com.learnwithhamster.service.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.learnwithhamster.service.domain.Discipline;
import com.learnwithhamster.service.repository.DisciplineRepository;
import java.util.stream.Stream;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Discipline} entity.
 */
public interface DisciplineSearchRepository extends ElasticsearchRepository<Discipline, Long>, DisciplineSearchRepositoryInternal {}

interface DisciplineSearchRepositoryInternal {
    Stream<Discipline> search(String query);

    Stream<Discipline> search(Query query);

    @Async
    void index(Discipline entity);

    @Async
    void deleteFromIndexById(Long id);
}

class DisciplineSearchRepositoryInternalImpl implements DisciplineSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final DisciplineRepository repository;

    DisciplineSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, DisciplineRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Stream<Discipline> search(String query) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery);
    }

    @Override
    public Stream<Discipline> search(Query query) {
        return elasticsearchTemplate.search(query, Discipline.class).map(SearchHit::getContent).stream();
    }

    @Override
    public void index(Discipline entity) {
        repository.findOneWithEagerRelationships(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Discipline.class);
    }
}

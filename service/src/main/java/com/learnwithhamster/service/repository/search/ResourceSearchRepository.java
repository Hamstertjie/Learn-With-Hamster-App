package com.learnwithhamster.service.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.learnwithhamster.service.domain.Resource;
import com.learnwithhamster.service.repository.ResourceRepository;
import java.util.stream.Stream;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Resource} entity.
 */
public interface ResourceSearchRepository extends ElasticsearchRepository<Resource, Long>, ResourceSearchRepositoryInternal {}

interface ResourceSearchRepositoryInternal {
    Stream<Resource> search(String query);

    Stream<Resource> search(Query query);

    @Async
    void index(Resource entity);

    @Async
    void deleteFromIndexById(Long id);
}

class ResourceSearchRepositoryInternalImpl implements ResourceSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final ResourceRepository repository;

    ResourceSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, ResourceRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Stream<Resource> search(String query) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery);
    }

    @Override
    public Stream<Resource> search(Query query) {
        return elasticsearchTemplate.search(query, Resource.class).map(SearchHit::getContent).stream();
    }

    @Override
    public void index(Resource entity) {
        repository.findById(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Resource.class);
    }
}

package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.Resource;
import com.learnwithhamster.service.repository.ResourceRepository;
import com.learnwithhamster.service.repository.search.ResourceSearchRepository;
import com.learnwithhamster.service.service.ResourceService;
import com.learnwithhamster.service.service.dto.ResourceDTO;
import com.learnwithhamster.service.service.mapper.ResourceMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.Resource}.
 */
@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {

    private static final Logger LOG = LoggerFactory.getLogger(ResourceServiceImpl.class);

    private final ResourceRepository resourceRepository;

    private final ResourceMapper resourceMapper;

    private final ResourceSearchRepository resourceSearchRepository;

    public ResourceServiceImpl(
        ResourceRepository resourceRepository,
        ResourceMapper resourceMapper,
        ResourceSearchRepository resourceSearchRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.resourceMapper = resourceMapper;
        this.resourceSearchRepository = resourceSearchRepository;
    }

    @Override
    public ResourceDTO save(ResourceDTO resourceDTO) {
        LOG.debug("Request to save Resource : {}", resourceDTO);
        Resource resource = resourceMapper.toEntity(resourceDTO);
        resource = resourceRepository.save(resource);
        resourceSearchRepository.index(resource);
        return resourceMapper.toDto(resource);
    }

    @Override
    public ResourceDTO update(ResourceDTO resourceDTO) {
        LOG.debug("Request to update Resource : {}", resourceDTO);
        Resource resource = resourceMapper.toEntity(resourceDTO);
        resource = resourceRepository.save(resource);
        resourceSearchRepository.index(resource);
        return resourceMapper.toDto(resource);
    }

    @Override
    public Optional<ResourceDTO> partialUpdate(ResourceDTO resourceDTO) {
        LOG.debug("Request to partially update Resource : {}", resourceDTO);

        return resourceRepository
            .findById(resourceDTO.getId())
            .map(existingResource -> {
                resourceMapper.partialUpdate(existingResource, resourceDTO);

                return existingResource;
            })
            .map(resourceRepository::save)
            .map(savedResource -> {
                resourceSearchRepository.index(savedResource);
                return savedResource;
            })
            .map(resourceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResourceDTO> findAll() {
        LOG.debug("Request to get all Resources");
        return resourceRepository.findAll().stream().map(resourceMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ResourceDTO> findOne(Long id) {
        LOG.debug("Request to get Resource : {}", id);
        return resourceRepository.findById(id).map(resourceMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Resource : {}", id);
        resourceRepository.deleteById(id);
        resourceSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResourceDTO> search(String query) {
        LOG.debug("Request to search Resources for query {}", query);
        try {
            return StreamSupport.stream(resourceSearchRepository.search(query).spliterator(), false).map(resourceMapper::toDto).toList();
        } catch (RuntimeException e) {
            throw e;
        }
    }
}

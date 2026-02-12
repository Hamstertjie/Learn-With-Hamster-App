import {
  entityConfirmDeleteButtonSelector,
  entityCreateButtonSelector,
  entityCreateCancelButtonSelector,
  entityCreateSaveButtonSelector,
  entityDeleteButtonSelector,
  entityDetailsBackButtonSelector,
  entityDetailsButtonSelector,
  entityEditButtonSelector,
  entityTableSelector,
} from '../../support/entity';

describe('Program e2e test', () => {
  const programPageUrl = '/program';
  const programPageUrlPattern = new RegExp('/program(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const programSample = { programName: 'amidst shakily conjecture' };

  let program;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/service/api/programs+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/service/api/programs').as('postEntityRequest');
    cy.intercept('DELETE', '/services/service/api/programs/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (program) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/service/api/programs/${program.id}`,
      }).then(() => {
        program = undefined;
      });
    }
  });

  it('Programs menu should load Programs page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('program');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Program').should('exist');
    cy.url().should('match', programPageUrlPattern);
  });

  describe('Program page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(programPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Program page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/program/new$'));
        cy.getEntityCreateUpdateHeading('Program');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', programPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/service/api/programs',
          body: programSample,
        }).then(({ body }) => {
          program = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/service/api/programs+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/service/api/programs?page=0&size=20>; rel="last",<http://localhost/services/service/api/programs?page=0&size=20>; rel="first"',
              },
              body: [program],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(programPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Program page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('program');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', programPageUrlPattern);
      });

      it('edit button click should load edit Program page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Program');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', programPageUrlPattern);
      });

      it('edit button click should load edit Program page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Program');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', programPageUrlPattern);
      });

      it('last delete button click should delete instance of Program', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('program').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', programPageUrlPattern);

        program = undefined;
      });
    });
  });

  describe('new Program page', () => {
    beforeEach(() => {
      cy.visit(`${programPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Program');
    });

    it('should create an instance of Program', () => {
      cy.get(`[data-cy="programName"]`).type('soybean minus director');
      cy.get(`[data-cy="programName"]`).should('have.value', 'soybean minus director');

      cy.get(`[data-cy="programDescription"]`).type('buck retention ultimate');
      cy.get(`[data-cy="programDescription"]`).should('have.value', 'buck retention ultimate');

      cy.get(`[data-cy="programPrice"]`).type('29361');
      cy.get(`[data-cy="programPrice"]`).should('have.value', '29361');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        program = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', programPageUrlPattern);
    });
  });
});

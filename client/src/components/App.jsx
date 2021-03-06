import React from 'react';
import axios from 'axios';

// components
import { Container } from 'semantic-ui-react';
import TabNav from './TabNav';
import TopNav from './TopNav';
import Cohort from './Cohort';

// queries
// import { getAllCohorts } from '../queries/queries';
import { getAllCohortsNoDb } from '../queries/queries';

const port = process.env.PORT || 1234;

/*
  eslint no-underscore-dangle: ["error", { "allowAfterThis": true }]
*/

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allCohorts: [],
      sprintCohorts: [],
      teamCohorts: [],
      display: '',
      selectedCohort: '',
      loading: false,
      showSegment: true,
      currentCommitData: {},
      projectData: {}
    };
    this.handleSelectCohort = this.handleSelectCohort.bind(this);
    this.handleSelectDisplay = this.handleSelectDisplay.bind(this);
    this.handleRepoSelect = this.handleRepoSelect.bind(this);
    this.checkSprints = this.checkSprints.bind(this);
    this.checkProjects = this.checkProjects.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this.getCohorts();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // use getAllCohorts if using graphQL & DB
  // use getAllCohortsNoDb if using config files only
  getCohorts() {
    // const cohortsQuery = getAllCohorts;
    const cohortsQuery = getAllCohortsNoDb;
    cohortsQuery()
      .then(result => {
        const allCohorts = result.data.data.cohorts;
        const sprintCohorts = allCohorts.filter(cohort => cohort.phase === 'sprint');
        const teamCohorts = allCohorts.filter(cohort => cohort.phase === 'project');
        const projectData = {};
        teamCohorts.forEach(cohort => {
          projectData[cohort.cohort_name] = {};
          projectData[cohort.cohort_name].fetched = false;
        });

        if (this._isMounted) {
          this.setState({
            sprintCohorts,
            teamCohorts,
            allCohorts,
            selectedCohort: sprintCohorts[0].cohort_name,
            projectData
          });
        }
      })
      .catch(error => {
        throw error;
      });
  }

  handleSelectDisplay(type) {
    const { sprintCohorts, teamCohorts } = { ...this.state };
    const selectedCohort =
      type === 'sprints' ? sprintCohorts[0].cohort_name : teamCohorts[0].cohort_name;
    this.setState({ display: type, selectedCohort });
  }

  handleSelectCohort(e) {
    this.setState({ selectedCohort: e.target.innerHTML, currentCommitData: {} });
  }

  handleRepoSelect(repos) {
    this.setState({ repos }, () => {
      this.checkSprints();
    });
  }

  checkSprints() {
    const { repos, selectedCohort } = { ...this.state };
    const repoString = repos.join('+');
    this.setState({ loading: true, showSegment: true }, () => {
      axios
        .get(`http://localhost:${port}/ghostbuster/sprints/${repoString}?cohort=${selectedCohort}`)
        .then(response =>
          this.setState({
            currentCommitData: response.data,
            loading: false,
            showSegment: true
          })
        )
        .catch(error => {
          throw error;
        });
    });
  }

  checkProjects() {
    const { selectedCohort, projectData } = { ...this.state };
    this.setState({ loading: true, showSegment: true }, () => {
      axios
        .get(
          `http://localhost:${port}/ghostbuster/teams/projects/${selectedCohort}/thesis/lifetime`
        )
        .then(response => {
          projectData[selectedCohort].lifetimeData = response.data;
        })
        .catch(error => {
          throw error;
        });
      axios
        .get(`http://localhost:${port}/ghostbuster/teams/projects/${selectedCohort}`)
        .then(response => {
          projectData[selectedCohort].weekThesisData = response.data.results;
          projectData[selectedCohort].fetched = true;
          this.setState({ projectData, loading: false });
        })
        .catch(error => {
          throw error;
        });
    });
  }

  render() {
    const { sprintCohorts, selectedCohort, loading, showSegment, currentCommitData } = this.state;

    const cohorts = (
      <Container>
        <TabNav
          selected={selectedCohort}
          cohorts={sprintCohorts}
          selectCohort={this.handleSelectCohort}
        />
        <Cohort
          repoSelect={this.handleRepoSelect}
          loading={loading}
          showSegment={showSegment}
          commits={currentCommitData}
        />
      </Container>
    );

    return (
      <div>
        <TopNav handleSelectDisplay={this.handleSelectDisplay} />
        {cohorts}
      </div>
    );
  }
}

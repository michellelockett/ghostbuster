import React from 'react';
import PropTypes from 'prop-types';
import RadioButtonList from '../../shared/RadioButtonList';
import TeamsList from './TeamsList';

function ManageTeams(props) {
  const {
    cohorts,
    handleRadioButtonChange,
    showTeamDetails,
    teamsListForSelectedCohort,
    selectedCohort
  } = props;
  return (
    <React.Fragment>
      <RadioButtonList
        cohorts={cohorts}
        handleRadioButtonChange={handleRadioButtonChange}
        showDetails={showTeamDetails}
        buttonLabel="Manage Teams"
      />
      <TeamsList
        teamsListForSelectedCohort={teamsListForSelectedCohort}
        selectedCohort={selectedCohort}
        showTeamDetails={showTeamDetails}
      />
    </React.Fragment>
  );
}

ManageTeams.propTypes = {
  cohorts: PropTypes.instanceOf(Array).isRequired,
  handleRadioButtonChange: PropTypes.func.isRequired,
  showTeamDetails: PropTypes.func.isRequired,
  selectedCohort: PropTypes.instanceOf(Object).isRequired,
  teamsListForSelectedCohort: PropTypes.instanceOf(Array).isRequired
};

export default ManageTeams;
const { query } = require('../index');

module.exports = {
  addTeam: team => {
    return query(`
      INSERT INTO teams (team_name, team_type, github, cohort_id)
      VALUES (
        '${team.teamName}',
        '${team.teamType}',
        '${team.github}',
        ${team.cohortId}
      )`)
      .then(() =>
        query(`
        SELECT * FROM teams WHERE team_name='${team.teamName}'
      `)
          .then(res => {
            const result = res.rows[0];
            return {
              teamId: result.id,
              teamName: result.team_name,
              teamType: result.team_type,
              github: result.github,
              cohortId: result.cohort_id
            };
          })
          .catch(err => err)
      )
      .catch(err => err);
  },

  addStudentToTeam: async (studentId, teamId) => {
    // TODO:  don't add a student record twice to the same team
    let existingRecord;
    try {
      existingRecord = await query(`
        SELECT * FROM team_student WHERE student_id=${studentId} AND team_id=${teamId}
      `);
      if (existingRecord.rows.length) {
        return 'student is already part of this team';
      }
    } catch (error) {
      console.log(error);
    }
    try {
      const teamStudentRecord = await query(`
        INSERT INTO team_student (team_id, student_id)
        VALUES (${teamId}, ${studentId})
      `);
      if (teamStudentRecord.rowCount) {
        const team = await module.exports.getTeamById(teamId);
        return { success: `added student to team ${team.team_name}` };
      }
      console.log(teamStudentRecord);
      return teamStudentRecord;
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  removeStudentFromTeam: async (studentId, teamId) => {
    try {
      const deleted = await query(`
        DELETE FROM team_student
        WHERE student_id=${studentId}
        AND team_id=${teamId}
      `);
      if (deleted.rowCount) {
        return 'Student was removed from team';
      }
      return 'Student is not part of this team';
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  removeStudentsFromTeam: async teamId => {
    try {
      const deleted = await query(`
        DELETE FROM team_student
        WHERE team_id=${teamId}
      `);
      if (deleted.rowCount) {
        return { deleted: deleted.rowCount };
      }
      return { deleted: 0 };
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  updateTeam: async (teamId, newTeamInfo) => {
    // update team
    try {
      const update = await query(`
      UPDATE teams SET (team_name, team_type, github, cohort_id) = (
        '${newTeamInfo.teamName}',
        '${newTeamInfo.teamType}',
        '${newTeamInfo.github}',
        ${newTeamInfo.cohortId}
      ) WHERE id = ${teamId}
    `);
      if (update.rowCount) {
        console.log(`Updated team ${teamId}`);
      } else {
        return 'unable to update cohort record';
      }
    } catch (error) {
      console.log(error);
      return error;
    }

    // retrieve updated cohort
    try {
      const team = await module.exports.getTeamById(teamId);
      return team;
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  getAllTeams: async () => {
    try {
      const teamQuery = await query('SELECT * FROM teams ORDER BY id ASC');
      return teamQuery.rows;
    } catch (err) {
      console.log(err.detail || err);
      return err;
    }
  },

  getTeamById: async teamId => {
    try {
      const team = await query(`SELECT * FROM teams WHERE id=${teamId}`);
      return team.rows[0];
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  getStudentsByTeamId: async teamId => {
    try {
      const studentQuery = await query(`
        SELECT
          students.id,
          students.first_name,
          students.last_name,
          students.github,
          students.cohort_id
        FROM students
        JOIN team_student ON(students.id=team_student.student_id)
        JOIN teams ON(teams.id=team_student.team_id)
        WHERE team_id=${teamId}
        ORDER BY first_name ASC`);

      return studentQuery.rows;
    } catch (error) {
      throw error;
      // console.log(error);
    }
  },

  getTeamWithStudents: async teamId => {
    let team;
    let students;
    // retrieve team
    try {
      team = await module.exports.getTeamById(teamId);
    } catch (error) {
      throw error;
      // console.log(error);
    }
    // retrive related students
    try {
      students = await module.exports.getStudentsByTeamId(teamId);
    } catch (error) {
      throw error;
      // console.log(error);
    }
    return { team, students };
  },

  getTeamsByCohortId: async cohortId => {
    try {
      const teamsByCohortQuery = await query(
        `SELECT * FROM teams WHERE cohort_id= ${cohortId} ORDER BY id ASC`
      );
      const teamsList = teamsByCohortQuery.rows;
      const teamsListWithStudents = await Promise.all(
        teamsList.map(async team => {
          const response = await module.exports.getTeamWithStudents(team.id);
          return response;
        })
      );
      const formattedTeamList = teamsListWithStudents.map(teamData => ({
        teamId: teamData.team.id,
        teamName: teamData.team.team_name,
        teamType: teamData.team.team_type,
        github: teamData.team.github,
        cohortId: teamData.team.cohort_id,
        students: teamData.students.map(student => ({
          studentId: student.id,
          name: `${student.first_name} ${student.last_name}`,
          studentGithub: student.github
        }))
      }));
      return formattedTeamList;
    } catch (err) {
      console.log(err.detail || err);
      return err;
    }
  },

  deleteTeamById: async teamId => {
    try {
      const deleteAssociatedStudents = await query(`
        DELETE FROM team_student
        WHERE team_id=${teamId}
      `);
      if (deleteAssociatedStudents.rowCount) {
        console.log(`${deleteAssociatedStudents.rowCount} Students were removed from team`);
      }
      const deletedTeam = await query(`
      DELETE FROM teams
      WHERE id=${teamId}
    `);
      if (deletedTeam.rowCount) {
        return 'removed team';
      }
      return 'no team found';
    } catch (error) {
      console.log(error);
      return error;
    }
  }
};

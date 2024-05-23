const mysql = require("mysql");
const readline = require("readline");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "votesystem",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: " + err.stack);
    return;
  }
  //console.log('Connected to database as id ' + connection.threadId);
});

/*const queries = [
  "CREATE TABLE admin (id int(11) NOT NULL,username varchar(50) NOT NULL,password varchar(60) NOT NULL,firstname varchar(50) NOT NULL,lastname varchar(50) NOT NULL,photo varchar(150) NOT NULL,created_on date NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
  "CREATE TABLE candidates (id int(11) NOT NULL,position_id int(11) NOT NULL,firstname varchar(30) NOT NULL,lastname varchar(30) NOT NULL,photo varchar(150) NOT NULL,platform text NOT NULL, no_of_votes INT DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
  "CREATE TABLE positions (id int(11) NOT NULL,description varchar(50) NOT NULL,max_vote int(11) NOT NULL,priority int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
  "CREATE TABLE voters (id int(11) NOT NULL,voters_id varchar(15) NOT NULL,password varchar(60) NOT NULL,firstname varchar(30) NOT NULL,lastname varchar(30) NOT NULL,photo varchar(150) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
  "CREATE TABLE votes (id int(11) NOT NULL,voters_id int(11) NOT NULL,candidate_id int(11) NOT NULL,position_id int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
];*/

function runQuery(query) {
  connection.query(query, (err, results) => {
    if (err) throw err;
    console.log("Query Results:");
    console.log(results);
  });
}

/*queries.forEach((query) => {
    connection.query(query, (err, results, fields) => {
        if (err) {
            console.error('Error executing query: ' + err.stack);
            return;
        }
        console.log('Query executed successfully');
    });
});*/

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function authenticateadminlogin() {
  rl.question("Enter username: ", (username) => {
    rl.question("Enter password: ", (password) => {
      const query = `SELECT * FROM admin WHERE username = '${username}' AND password = '${password}'`;
      connection.query(query, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          console.log("Authentication successful!");
        } else {
          console.log("Authentication failed!");
        }
        rl.close();
      });
    });
  });
}

function addCandidate() {
  rl.question("Enter first name: ", (firstName) => {
    rl.question("Enter last name: ", (lastName) => {
      rl.question("Enter photo id: ", (photoid) => {
        rl.question("Enter agenda: ", (agenda) => {
          rl.question(
            "Enter Description for which position: ",
            (description) => {
              const query = `INSERT INTO candidates (position_id, firstname, lastname, photo, platform) SELECT id, '${firstName}', '${lastName}', '${photoid}', '${agenda}' FROM positions where description='${description}';`;
              connection.query(query, (err, result) => {
                if (err) throw err;
                console.log("Candidate inserted successfully!");
                rl.close();
              });
            }
          );
        });
      });
    });
  });
}

function addvoter() {
  rl.question("Enter voter id: ", (voter_id) => {
    rl.question("Enter password: ", (password) => {
      rl.question("Enter first name: ", (firstName) => {
        rl.question("Enter last name: ", (lastName) => {
          rl.question("Enter photo id: ", (photoid) => {
            const query = `INSERT INTO voters(voters_id, password, firstname, lastname, photo) VALUES ('${voter_id}','${password}','${firstName}','${lastName}','${photoid}');`;
            connection.query(query, (err, result) => {
              if (err) throw err;
              console.log("Voter details inserted successfully!");
              rl.close();
            });
          });
        });
      });
    });
  });
}

function logoutadmin() {
  console.log("Logout Successfully");
}

function loginvoter() {
  rl.question("Enter voter id: ", (voterid) => {
    rl.question("Enter password: ", (password) => {
      const query = `SELECT * FROM voters WHERE voters_id = '${voterid}' AND password = '${password}'`;
      connection.query(query, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          console.log("Login successful!");
        } else {
          console.log("Login failed!");
        }
        rl.close();
      });
    });
  });
}

function viewcandidatedetail() {
  const query = `SELECT c.id AS candidate_id, p.description AS position_description, c.firstname, c.lastname FROM positions p LEFT JOIN candidates c ON p.id = c.position_id ORDER BY p.id, c.id;`;
  connection.query(query, (err, results) => {
    if (err) throw err;
    console.log("Unfilled parking slots:");
    console.log(results);
    rl.close();
  });
}

function givevote() {
  rl.question("Enter your Voter id: ", (voter_id) => {
    rl.question(
      "Enter Candidate id whom you want to give a vote: ",
      (candidate_id) => {
        connection.query(
          `INSERT INTO votes (voters_id, candidate_id, position_id) SELECT '${voter_id}', '${candidate_id}', position_id FROM candidates where id='${candidate_id}';`,
          (err, result) => {
            if (err) throw err;

            rl.close();
          }
        );
        connection.query(
          `UPDATE candidates c JOIN votes v ON c.id = v.candidate_id SET no_of_votes = no_of_votes + 1 WHERE c.id = ${candidate_id} AND v.candidate_id = ${candidate_id};`,
          (err, result) => {
            if (err) throw err;
            console.log("Your vote has been saved!");
            rl.close();
          }
        );
      }
    );
  });
}

//Trigger for vote only once
/*DELIMITER //

CREATE TRIGGER before_insert_vote
BEFORE INSERT ON votes
FOR EACH ROW
BEGIN
    DECLARE voter_count INT;
    
    SELECT COUNT(*) INTO voter_count
    FROM votes
    WHERE voters_id = NEW.voters_id;
    
    IF voter_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'You have already voted.';
    END IF;
END//

DELIMITER ;*/

function viewvotestatistics() {
  const query = `SELECT COUNT(*) AS total_votes FROM votes;`;
  const query1 = `SELECT (SELECT COUNT(*) FROM votes) AS total_votes, (SELECT COUNT(*) FROM voters) AS total_voters, (SELECT COUNT(*) FROM votes) / (SELECT COUNT(*) FROM voters) * 100 AS voter_turnout;`;
  connection.query(query, (err, results) => {
    if (err) throw err;
    console.log(results);
    rl.close();
  });
  connection.query(query1, (err, results) => {
    if (err) throw err;
    console.log(results);
    rl.close();
  });
}

function viewvoteresult() {
  const query = `SELECT p.id AS position_id, p.description AS position_description, c.id AS candidate_id, c.firstname, c.lastname, COUNT(v.id) AS votes_received FROM positions p JOIN candidates c ON p.id = c.position_id LEFT JOIN votes v ON c.id = v.candidate_id GROUP BY p.id, c.id ORDER BY p.id, c.id;`;
  connection.query(query, (err, results) => {
    if (err) throw err;
    console.log(results);
    rl.close();
  });
}

function maxvotes() {
    const query = `WITH MaxVotesPerPosition AS ( SELECT position_id, MAX(vote_count) AS max_votes FROM (SELECT position_id, candidate_id, COUNT(*) AS vote_count FROM votes GROUP BY position_id, candidate_id) AS vote_counts GROUP BY position_id ) SELECT p.id AS position_id, p.description AS position_description, c.id AS candidate_id, c.firstname, mvpp.max_votes AS max_votes_received FROM MaxVotesPerPosition mvpp JOIN positions p ON mvpp.position_id = p.id JOIN candidates c ON mvpp.position_id = c.position_id AND mvpp.max_votes = (SELECT COUNT(*) FROM votes WHERE position_id = mvpp.position_id AND candidate_id = c.id) ORDER BY p.id;`;
    connection.query(query, (err, results) => {
      if (err) throw err;
      console.log(results);
      rl.close();
    });
  }

function handleUserSelection(option) {
  switch (option) {
    case "1":
      authenticateadminlogin();
      break;
    case "2":
      addCandidate();
      break;
    case "3":
      addvoter();
      break;
    case "4":
      logoutadmin();
      break;
    case "5":
      loginvoter();
      break;
    case "6":
      viewcandidatedetail();
      break;
    case "7":
      givevote();
      break;
    case "8":
      viewvotestatistics();
      break;
    case "9":
      viewvoteresult();
      break;
    case "10":
      maxvotes();
      break;
    default:
      console.log("Invalid option!");
  }
}

function main() {
  console.log("1. Authenticate Admin login");
  console.log("2. Add new Candidate");
  console.log("3. Add Voter");
  console.log("4. Logout Admin");
  console.log("5. Login Voter");
  console.log("6. Show Candidates with their id, name and position");
  console.log("7. Give your Vote");
  console.log(
    "8. View overall voting statistics (e.g., total votes cast, voter turnout)"
  );
  console.log("9. View voting results");
  console.log("10. Display those candidate who have maximum votes");
  rl.question("Enter option: ", (option) => {
    handleUserSelection(option);
  });
}

main();

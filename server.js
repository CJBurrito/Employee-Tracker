const inquirer = require("inquirer");
const mysql = require("mysql");
const cTable = require('console.table');

var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "bobvance",
    database: "employees_db"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    init();
});

const initialQuestion = [
    {
        name: "initQuestion",
        type: "list",
        message: "What would you like to do?",
        choices: ["Add Departments", "Add Roles", "Add Employees", new inquirer.Separator(), "View Departments", "View Roles",
            "View Employees", new inquirer.Separator(), "Update Employee Roles"]
    },
];

function addEmployee() {
    let dep;
    let roles;
    let manager;

    connection.query("SELECT * FROM departments", function (err, results) {
        if (err) throw err;
        dep = results;
    });

    connection.query("SELECT * FROM roles", function (err, results) {
        if (err) throw err;
        roles = results;
    });

    connection.query("SELECT * FROM employees", function (err, results) {
        if (err) throw err;
        manager = results;
    });


    inquirer
        .prompt([
            {
                name: "firstName",
                type: "input",
                message: "What is the employee's first name?"
            },
            {
                name: "lastName",
                type: "input",
                message: "What is the employee's last name?"
            },
            {
                name: "departmentChoice",
                type: "list",
                choices: function () {
                    var choiceArray = [];
                    for (var i = 0; i < dep.length; i++) {
                        choiceArray.push(dep[i].department_name);
                    }
                    return choiceArray;
                },
                message: "What department does this employee belong to?"
            },
            {
                name: "roleChoice",
                type: "list",
                choices: function () {
                    var choiceArray = [];
                    for (var i = 0; i < roles.length; i++) {
                        choiceArray.push(roles[i].title);
                    }
                    return choiceArray;
                },
                message: "What role does this employee have?"
            },
            {
                name: "managerChoice",
                type: "list",
                choices: function () {
                    var choiceArray = [];
                    for (var i = 0; i < manager.length; i++) {
                        choiceArray.push(manager[i].first_name + " " + manager[i].last_name);
                    }
                    return choiceArray;
                },
                message: "What manager does this employee report to?"
            },
        ])
        .then((res) => {
            let roleID;
            let managerID;

            for (var i = 0; i < roles.length; i++) {
                if (roles[i].title === res.roleChoice) {
                    roleID = roles[i].id;
                }
            };

            for (var i = 0; i < manager.length; i++) {
                if (manager[i].first_name + " " + manager[i].last_name === res.managerChoice) {
                    managerID = manager[i].id;
                }
            };

            connection.query("INSERT INTO employees SET ?", {
                first_name: res.firstName,
                last_name: res.lastName,
                role_id: roleID,
                manager_id: managerID,
            }, function (err, res) {
                if (err) throw err;
                console.log("Employee added.");
            })

            init();
        });
};

function addDepartment() {
    inquirer.prompt(
        {
            name: "deptAdd",
            type: "input",
            message: "What Department would you like to add?",
        })
        .then((res) => {
            connection.query("INSERT INTO departments SET ?", {
                department_name: res.deptAdd
            });

            init();
        });
};

function addRole() {
    let dep;

    connection.query("SELECT * FROM departments", function (err, results) {
        if (err) throw err;
        dep = results;
    });

    inquirer.prompt(
        {
            name: "roleAdd",
            type: "input",
            message: "What role would you like to add?",
        },
        {
            name: "salaryAdd",
            type: "input",
            message: "What is the salary of this role?",
        },
        {
            name: "departmentChoice",
            type: "list",
            choices: function () {
                var choiceArray = [];
                for (var i = 0; i < dep.length; i++) {
                    choiceArray.push(dep[i].department_name);
                }
                return choiceArray;
            },
            message: "What department does is this role for?"
        },
    )
        .then((res) => {
            let deptID;

            for (var i = 0; i < dep.length; i++) {
                if (dep[i].department_name === res.departmentChoice) {
                    deptID = dep[i].id;
                }
            };

            connection.query("INSERT INTO roles SET ?", {
                tile: res.roleAdd,
                salary: res.salaryAdd,
                department_id: deptID,
            });

            init();
        });
};

function viewDepartments() {
    connection.query("SELECT * FROM departments", function (err, results) {
        if (err) throw err;
        let list = [];

        for (var i = 0; i < results.length; i++) {
            list.push([results[i].department_name]);
        };

        console.table(['Departments'], list);

        init();
    });
};

function viewRoles() {
    connection.query("SELECT * FROM roles", function (err, results) {
        if (err) throw err;
        let list = [];

        connection.query("SELECT * FROM departments", function (err, res) {
            if (err) throw err;

            for (var i = 0; i < results.length; i++) {
                let depID = results[i].department_id;
                let depName;

                for (var k = 0; k < res.length; k++) {
                    if (depID === res[k].id) {
                        depName = res[k].department_name;
                    }
                }

                list.push([results[i].title, results[i].salary, depName]);
            };

            console.table(['Roles', 'Salaries', 'Departments'], list);

            init();
        });
    });
};

function viewEmployees() {
    connection.query("SELECT * FROM employees", function (err, results) {
        if (err) throw err;
        let list = [];

        connection.query("SELECT * FROM roles", function (err, res) {
            if (err) throw err;

            //Loop for each Employee line
            for (var i = 0; i < results.length; i++) {
                let name = results[i].first_name + " " + results[i].last_name;
                let manID = results[i].manager_id;
                let roleID = results[i].role_id;
                let roleName;

                //Loop for each role name
                for (var k = 0; k < res.length; k++) {
                    if (roleID === res[k].id) {
                        roleName = res[k].title;
                    }
                }

                //Loof for each manager name
                for (var p = 0; p < results.length; p++) {
                    if (manID === results[p].manager_id) {
                        manName = results[p].first_name + " " + results[p].last_name;
                    }
                }

                list.push([name, roleName, manName]);
            };

            console.table(['Names', 'Roles', 'Managers'], list);

            init();
        });
    });

};

function updateEmployeeRole() {
    inquirer.prompt([{
        name: "employeeSelect",
        type: "list",
        message: "What Employee would you like to change roles?",
        choices: function () {
            var choiceArray = [];
            for (var i = 0; i < masterEmployees.length; i++) {
                choiceArray.push(masterEmployees[i].first_name + " " + masterEmployees[i].last_name);
            }
            return choiceArray;
        },
    },
    {
        name: "roleSelect",
        type: "list",
        message: "What role would you like to give this employee?",
        choices: function () {
            var choiceArray = [];
            for (var i = 0; i < masterRoles.length; i++) {
                choiceArray.push(masterRoles[i].title);
            }
            return choiceArray;
        },
    }])
        .then((res) => {
            let roleID;
            let employeeID;

            for (var i = 0; i < masterRoles.length; i++) {
                if (masterRoles[i].title === res.roleSelect) {
                    roleID = masterRoles[i].id;
                }
            };

            for (var i = 0; i < masterEmployees.length; i++) {
                if (masterEmployees[i].first_name + " " + masterEmployees[i].last_name === res.employeeSelect) {
                    employeeID = masterEmployees[i].id;
                }
            };

            connection.query("UPDATE employees SET role_id = ? WHERE id = ?", [roleID, employeeID], function (err, res) {
                if (err) throw err;

                console.log("Employee record updated.");

                init();
            });

        })
}

let masterEmployees;
let masterRoles;

function init() {
    connection.query("SELECT * FROM employees", function (err, results) {
        if (err) throw err;
        masterEmployees = results;
    });

    connection.query("SELECT * FROM roles", function (err, results) {
        if (err) throw err;
        masterRoles = results;
    });

    inquirer
        .prompt(initialQuestion)
        .then((inquirerResponses) => {
            if (inquirerResponses.initQuestion === "Add Employees") {
                addEmployee();
            };
            if (inquirerResponses.initQuestion === "Add Departments") {
                addDepartment();
            };
            if (inquirerResponses.initQuestion === "Add Roles") {
                addRole();
            };
            if (inquirerResponses.initQuestion === "View Departments") {
                viewDepartments();
            };
            if (inquirerResponses.initQuestion === "View Roles") {
                viewRoles();
            };
            if (inquirerResponses.initQuestion === "View Employees") {
                viewEmployees();
            };
            if (inquirerResponses.initQuestion === "Update Employee Roles") {
                updateEmployeeRole();
            };
        });
};

import firebaseConfig from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";

import {
  getFirestore,
  collection,
  getDoc,
  doc,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Init firebase
const app = initializeApp(firebaseConfig);

// Init services
const db = getFirestore();

// Collection ref
const colRef = collection(db, "tasks");

// Query ref
const queryRef = query(colRef, orderBy("createdAt", "desc"));

// Elements
const textInputEl = document.querySelector(".input-form");
const taskListEl = document.querySelector(".task-list");
const taskCountEl = document.querySelector(".task-count");
const taskDescEl = document.querySelector(".task-desc");
const colorSwitch = document.querySelector("#input-color-switch");
const addTaskBtn = document.querySelector(".add-btn");

// Add Task
const addTask = function () {
  textInputEl.addEventListener("submit", function (e) {
    e.preventDefault();

    formValidation();

    textInputEl.text.value = "";
  });

  addTaskBtn.addEventListener("click", function () {
    formValidation();

    textInputEl.text.value = "";
  });
};

// Validate user input
const formValidation = function () {
  !textInputEl.text.value.trim()
    ? displayEmptyFieldsMessage()
    : addDoc(colRef, {
        task: textInputEl.text.value,
        description: "",
        status: "active",
        open: false,
        createdAt: serverTimestamp(),
      });
};

// Get tasks
const getTasks = function () {
  onSnapshot(queryRef, (snapshot) => {
    let tasks = [];
    snapshot.docs.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    generateTasks(tasks);
    generateTaskDescriptions(tasks);
  });
};

// Display list of tasks
const generateTasks = function (taskItems) {
  console.log(taskItems);
  let taskItemsHTML = "";

  taskItems.forEach((taskItem) => {
    taskItemsHTML += `
    <li class="task-item ${taskItem.open === true ? "active" : ""} "data-id="${
      taskItem.id
    }">
      <div class="task-item-container">
        <div class="checkbox-container">
          <div class="check-mark ${
            taskItem.status === "completed" ? "checked" : ""
          } "data-id="${taskItem.id}" >
            <img src="/assets/icon-check.svg" alt="check mark icon" />
          </div>
          <span class="task-item-title">${taskItem.task}</span>
        </div>
        <button class="close-btn "data-id="${taskItem.id}"">x</button>
      </div>
  </li>
    `;
  });
  taskListEl.innerHTML = taskItemsHTML;
  createEventListeners();
  taskCount(taskItems);
};

// Display task description
const generateTaskDescriptions = function (taskItems) {
  let taskDescHTML = "";
  taskItems.forEach((taskItem) => {
    taskDescHTML += `
    <div class="task-desc-container ${
      taskItem.open === true ? "open" : ""
    } "data-id="${taskItem.id}" ">
      <p class="timestamp">
        <span class="created"> Created:</span>
        <span class="current-date">${moment(
          taskItem.createdAt?.toDate()
        ).calendar()}</span>
      </p>
      <div class="task-desc-textarea">
        <form class="textarea-form">
          <textarea
            name="details"
            class="task-desc-textarea-input "data-id="${taskItem.id}" "
            placeholder="Task Description"
          >${taskItem.description || ""}</textarea>
        </form>
      </div>
  </div>
    `;

    taskDescEl.innerHTML = taskDescHTML;
  });
  createEventListeners();
};

// Event Handlers
const createEventListeners = function () {
  // Check mark task
  const checkMarks = document.querySelectorAll(".check-mark");
  checkMarks.forEach((checkMark) => {
    checkMark.addEventListener("click", function () {
      checkMarkComplete(checkMark.dataset.id);
    });
  });

  // Toggle the delete button
  const taskListItemEls = document.querySelectorAll(".task-item");
  // console.log(taskListItemEls);
  taskListItemEls.forEach((taskListItemEl) => {
    const taskCloseBtns = taskListItemEl.querySelector(".close-btn");
    taskListItemEl.addEventListener("mouseover", function (e) {
      taskCloseBtns.style.display = "inline-block";
    });

    taskListItemEl.addEventListener("mouseleave", function () {
      taskCloseBtns.style.display = "none";
    });
  });

  // Display a specific task description
  taskListItemEls.forEach((currentTaskListItemEl) => {
    currentTaskListItemEl.addEventListener("click", function () {
      console.log("clicked");
      taskListItemEls.forEach((otherTaskListItemEl) => {
        if (
          otherTaskListItemEl.dataset.id !== currentTaskListItemEl.dataset.id
        ) {
          updateDoc(doc(db, "tasks", otherTaskListItemEl.dataset.id), {
            open: false,
          });
        }
      });
      openTaskDescription(currentTaskListItemEl.dataset.id);
    });
  });

  // Adding text to the description filed
  const textareaEls = document.querySelectorAll(".task-desc-textarea-input");

  textareaEls.forEach((textareaEl) => {
    let textVale = "";
    textareaEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        textVale = textareaEl.value;
        updateDoc(doc(db, "tasks", textareaEl.dataset.id), {
          description: textVale,
        });
      }
    });
  });

  // Delete a task
  const deleteBtns = document.querySelectorAll(".close-btn");
  deleteBtns.forEach((deleteBtn) => {
    deleteBtn.addEventListener("click", function () {
      deleteTask(deleteBtn.dataset.id);
    });
  });
};

//Checking if check mark is completed
const checkMarkComplete = function (checkMarkId) {
  const docRefs = doc(db, "tasks", checkMarkId);

  getDoc(docRefs).then((doc) => {
    const checkMarkStatus = doc.data().status;
    console.log(checkMarkStatus);

    if (checkMarkStatus === "active") {
      updateDoc(docRefs, {
        status: "completed",
      });
    } else if (checkMarkStatus === "completed") {
      updateDoc(docRefs, {
        status: "active",
      });
    }
  });
};

// Open specific task description
const openTaskDescription = function (TaskListItemsID) {
  const docRefs = doc(db, "tasks", TaskListItemsID);
  console.log(TaskListItemsID);
  getDoc(docRefs)
    .then((doc) => {
      if (doc.data().open === true) {
        updateDoc(docRefs, {
          open: false,
        });
      } else if (doc.data().open === false) {
        updateDoc(docRefs, {
          open: true,
        });
      }
    })
    .catch((err) => {
      console.log("error");
    });
};

// Delete a specific task
const deleteTask = function (deleteBtnId) {
  const docRef = doc(db, "tasks", deleteBtnId);
  deleteDoc(docRef);
};

// Display count of tasks
const taskCount = function (taskItems) {
  taskCountEl.innerHTML = taskItems.length;
};

// Invalid submission
const displayEmptyFieldsMessage = function () {
  console.log("no user input");
};

// Dark Mode
const htmlHeadEl = document.head;
const stylesheet = document.createElement("link");
stylesheet.rel = "stylesheet";
stylesheet.href = "/css/dark.css";

const checkMode = function () {
  colorSwitch.checked === true
    ? htmlHeadEl.appendChild(stylesheet)
    : htmlHeadEl.removeChild(stylesheet);
};

colorSwitch.addEventListener("click", checkMode);

addTask();
getTasks();

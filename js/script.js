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
// Add Task
const addTask = function () {
  textInputEl.addEventListener("submit", function (e) {
    e.preventDefault();

    formValidation();

    textInputEl.text.value = "";
  });
};

// Validate user input
const formValidation = function () {
  !textInputEl.text.value
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
  });
};

// Display list of tasks
const generateTasks = function (taskItems) {
  console.log(taskItems);
  let taskItemsHTML = "";

  taskItems.forEach((taskItem) => {
    taskItemsHTML += `
    <li class="task-item">
      <div class="task-item-container">
        <div class="checkbox-container">
          <div class="check-mark ${
            taskItem.status === "completed" ? "checked" : ""
          } "data-id="${taskItem.id}" >
            <img src="/assets/icon-check.svg" alt="checkmark icon" />
          </div>
          <span class="task-item-title">${taskItem.task}</span>
        </div>
        <button class="close-btn">x</button>
      </div>
  </li>
    
    `;
  });
  taskListEl.innerHTML = taskItemsHTML;
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

// Invalid submission
const displayEmptyFieldsMessage = function () {
  console.log("no user input");
};

addTask();
getTasks();

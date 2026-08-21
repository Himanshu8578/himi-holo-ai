/* ============================================================
   HIMI HOLO AI
   FEATURE ENGINE — PHASE 1
   script.js
   ============================================================ */

import HimiAvatar from "./3D/avatar.js";

"use strict";

/* ============================================================
   CONFIG
   ============================================================ */

const CONFIG = {
    API_BASE: "http://127.0.0.1:8000",
    CHAT_ENDPOINT: "/chat",
    IMAGE_ENDPOINT: "/image-chat",

    REQUEST_TIMEOUT: 120000,

    STORAGE_KEY: "himi_sessions_v1",
    ACTIVE_SESSION_KEY: "himi_active_session_v1",

    MAX_MESSAGE_LENGTH: 12000,

    HEALTH_INTERVAL: 15000
};


/* ============================================================
   STATE
   ============================================================ */

const state = {

    avatar: null,

    connected: false,

    sending: false,

    abortController: null,

    listening: false,

    speaking: false,

    recognition: null,

    recognitionSupported: false,

    speechSupported:
        "speechSynthesis" in window,

    selectedFile: null,

    selectedImage: null,

    sessions: [],

    activeSessionId: null,

    lastUserMessage: "",

    lastAssistantMessage: "",

    toastTimer: null
};


/* ============================================================
   DOM
   ============================================================ */

const DOM = {};


/* ============================================================
   INIT
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    cacheDOM();

    loadSessions();

    setupClock();

    setupChat();

    setupKeyboard();

    setupVoice();

    setupFiles();

    setupNewChat();

    setupSearch();

    setupExport();

    initializeAvatar();

    restoreActiveSession();

    await checkBackend();

    startHealthMonitor();

    setSystemReady();

    setupClearChat();

}


/* ============================================================
   DOM CACHE
   ============================================================ */

function cacheDOM() {

    const ids = [

        "holoCanvas",
        "avatarLoader",
        "loaderProgress",

        "messagesContainer",
        "messageInput",
        "sendButton",

        "newChatButton",

        "micButton",
        "voiceButton",
        "voiceButtonText",
        "voiceButtonIcon",

        "voiceOverlay",
        "stopVoiceButton",
        "voiceOverlayText",

        "fileInput",
        "imageInput",
        "attachmentButton",

        "attachmentPreview",
        "attachmentInfo",
        "removeAttachment",

        "systemStatusText",
        "systemStatusDot",
        "systemClock",

        "aiCoreStatus",
        "memoryStatus",
        "voiceStatus",

        "onlineStateText",
        "avatarStateText",
        "engineStatus",

        "hologramLinkStatus",
        "footerStatus",

        "himiToast",
        "toastTitle",
        "toastMessage",

        "chatSearch",
        "chatSearchInput",
        "sessionList",

        "exportChatButton",
        "clearChatButton"

    ];

    ids.forEach(
        id => {

            DOM[id] =
                document.getElementById(id);

        }
    );

}


/* ============================================================
   AVATAR
   ============================================================ */

function initializeAvatar() {

    if (!DOM.holoCanvas) {

        console.error(
            "HIMI: holoCanvas missing."
        );

        return;

    }

    try {

        setLoaderProgress(20);

        state.avatar =
            new HimiAvatar(
                DOM.holoCanvas
            );

        window.himiAvatar =
            state.avatar;

        setLoaderProgress(100);

        setTimeout(
            hideAvatarLoader,
            600
        );

        setAvatarState(
            "SYSTEM READY"
        );

    }
    catch (error) {

        console.error(
            "Avatar error:",
            error
        );

        setEngineStatus(
            "AVATAR ERROR"
        );

        showToast(
            "3D ENGINE",
            "Avatar could not initialize."
        );

    }

}


function setLoaderProgress(value) {

    if (
        DOM.loaderProgress
    ) {

        DOM.loaderProgress.style.width =
            `${value}%`;

    }

}


function hideAvatarLoader() {

    if (
        DOM.avatarLoader
    ) {

        DOM.avatarLoader.classList.add(
            "hidden"
        );

    }

}


/* ============================================================
   CLOCK
   ============================================================ */

function setupClock() {

    function updateClock() {

        if (!DOM.systemClock) {
            return;
        }

        DOM.systemClock.textContent =
            new Date().toLocaleTimeString(
                "en-GB",
                {
                    hour12: false
                }
            );

    }

    updateClock();

    setInterval(
        updateClock,
        1000
    );

}


/* ============================================================
   CHAT
   ============================================================ */

function setupChat() {

    if (DOM.sendButton) {

        DOM.sendButton.addEventListener(
            "click",
            sendMessage
        );

    }

}


function setupKeyboard() {

    if (!DOM.messageInput) {
        return;
    }

    DOM.messageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

    DOM.messageInput.addEventListener(
        "input",
        resizeInput
    );

}


function resizeInput() {

    if (!DOM.messageInput) {
        return;
    }

    DOM.messageInput.style.height =
        "auto";

    DOM.messageInput.style.height =
        Math.min(
            DOM.messageInput.scrollHeight,
            150
        ) + "px";

}


/* ============================================================
   SEND MESSAGE
   ============================================================ */

async function sendMessage() {

    if (state.sending) {
        return;
    }

    const text =
        DOM.messageInput
            ?.value
            ?.trim() || "";

    if (
        !text &&
        !state.selectedFile &&
        !state.selectedImage
    ) {
        return;
    }

    if (
        text.length >
        CONFIG.MAX_MESSAGE_LENGTH
    ) {

        showToast(
            "MESSAGE",
            "Message exceeds the allowed length."
        );

        return;

    }

    ensureActiveSession();

    state.sending = true;

    state.lastUserMessage =
        text;

    setComposerDisabled(true);

    if (text) {

        addMessage(
            "you",
            text
        );

        addToActiveSession(
            "user",
            text
        );

    }

    DOM.messageInput.value = "";

    resizeInput();

    setAvatarThinking();

    try {

        let response;

        if (state.selectedImage) {

            response =
                await sendImage(
                    text,
                    state.selectedImage
                );

        }
        else if (state.selectedFile) {

            response =
                await sendFile(
                    text,
                    state.selectedFile
                );

        }
        else {

            response =
                await sendChat(
                    text
                );

        }

        const answer =
            extractResponse(
                response
            );

        state.lastAssistantMessage =
            answer;

        addMessage(
            "himi",
            answer
        );

        addToActiveSession(
            "assistant",
            answer
        );

        saveSessions();

        speakText(
            answer
        );

    }
    catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            addMessage(
                "himi",
                "Generation stopped."
            );

            setAvatarIdle();

        }
        else {

            console.error(
                "HIMI:",
                error
            );

            addMessage(
                "himi",
                "I couldn't reach the AI backend."
            );

            showToast(
                "BACKEND ERROR",
                getErrorMessage(error)
            );

            setAvatarIdle();

        }

    }
    finally {

        state.sending = false;

        state.abortController =
            null;

        setComposerDisabled(false);

        clearAttachment();

        saveSessions();

    }

}


/* ============================================================
   CHAT REQUEST
   ============================================================ */

async function sendChat(
    message
) {

    const session =
        getActiveSession();

    const history =
        session
            ? session.messages
                .slice(-30)
                .map(item => ({

                    role:
                        item.role,

                    content:
                        item.content

                }))
            : [];

    return apiRequest(
        CONFIG.CHAT_ENDPOINT,
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body:
                JSON.stringify({

                    message,

                    history

                })

        }
    );

}


/* ============================================================
   IMAGE
   ============================================================ */

async function sendImage(
    message,
    file
) {

    const form =
        new FormData();

    form.append(
        "message",
        message ||
        "Analyze this image."
    );

    form.append(
        "image",
        file
    );

    return apiRequest(
        CONFIG.IMAGE_ENDPOINT,
        {

            method: "POST",

            body: form

        }
    );

}


/* ============================================================
   FILE
   ============================================================ */

async function sendFile(
    message,
    file
) {

    const form =
        new FormData();

    form.append(
        "message",
        message ||
        `Analyze this file: ${file.name}`
    );

    form.append(
        "file",
        file
    );

    return apiRequest(
        CONFIG.CHAT_ENDPOINT,
        {

            method: "POST",

            body: form

        }
    );

}


/* ============================================================
   API REQUEST
   ============================================================ */

async function apiRequest(
    endpoint,
    options = {}
) {

    state.abortController =
        new AbortController();

    const timeout =
        setTimeout(
            () => {

                state.abortController.abort();

            },
            CONFIG.REQUEST_TIMEOUT
        );

    try {

        const response =
            await fetch(

                CONFIG.API_BASE +
                endpoint,

                {

                    ...options,

                    signal:
                        state.abortController.signal

                }

            );

        if (!response.ok) {

            let detail = "";

            try {

                const data =
                    await response.json();

                detail =
                    data.detail ||
                    data.message ||
                    data.error ||
                    "";

            }
            catch {

                detail =
                    await response.text();

            }

            throw new Error(
                detail ||
                `HTTP ${response.status}`
            );

        }

        state.connected =
            true;

        setConnectionUI(true);

        return await response.json();

    }
    finally {

        clearTimeout(
            timeout
        );

    }

}


/* ============================================================
   STOP GENERATION
   ============================================================ */

function stopGeneration() {

    if (
        state.abortController
    ) {

        state.abortController.abort();

        state.abortController =
            null;

    }

    state.sending = false;

    setComposerDisabled(false);

    setAvatarIdle();

}


window.stopHimiGeneration =
    stopGeneration;


/* ============================================================
   RESPONSE PARSER
   ============================================================ */

function extractResponse(data) {

    if (
        typeof data ===
        "string"
    ) {

        return data;

    }

    if (!data) {

        return "Empty response received.";

    }

    const keys = [

        "response",
        "reply",
        "answer",
        "message",
        "text",
        "content"

    ];

    for (
        const key of keys
    ) {

        if (
            typeof data[key] ===
            "string" &&
            data[key].trim()
        ) {

            return data[key];

        }

    }

    if (data.data) {

        return extractResponse(
            data.data
        );

    }

    return JSON.stringify(
        data,
        null,
        2
    );

}


/* ============================================================
   MESSAGE UI
   ============================================================ */

function addMessage(
    type,
    text
) {

    if (!DOM.messagesContainer) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        type === "you"
            ? "message message-you"
            : "message message-himi";

    const label =
        document.createElement(
            "div"
        );

    label.className =
        "message-label";

    label.textContent =
        type === "you"
            ? "YOU"
            : "HIMI";

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    const paragraph =
        document.createElement(
            "p"
        );

    paragraph.textContent =
        text;

    content.appendChild(
        paragraph
    );

    wrapper.appendChild(
        label
    );

    wrapper.appendChild(
        content
    );

    if (
        type === "himi"
    ) {

        addMessageActions(
            wrapper,
            text
        );

    }

    DOM.messagesContainer.appendChild(
        wrapper
    );

    scrollMessages();

}


function addMessageActions(
    wrapper,
    text
) {

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "message-actions";


    /* COPY */

    const copy =
        document.createElement(
            "button"
        );

    copy.type =
        "button";

    copy.textContent =
        "COPY";

    copy.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    text
                );

                showToast(
                    "COPIED",
                    "Response copied."
                );

            }
            catch {

                showToast(
                    "COPY",
                    "Clipboard access failed."
                );

            }

        }
    );


    /* SPEAK */

    const speak =
        document.createElement(
            "button"
        );

    speak.type =
        "button";

    speak.textContent =
        "SPEAK";

    speak.addEventListener(
        "click",
        () => {

            speakText(
                text
            );

        }
    );


    /* REGENERATE */

    const regenerate =
        document.createElement(
            "button"
        );

    regenerate.type =
        "button";

    regenerate.textContent =
        "REGENERATE";

    regenerate.addEventListener(
        "click",
        () => {

            regenerateLast();

        }
    );


    actions.appendChild(
        copy
    );

    actions.appendChild(
        speak
    );

    actions.appendChild(
        regenerate
    );

    wrapper.appendChild(
        actions
    );

}


/* ============================================================
   REGENERATE
   ============================================================ */

function regenerateLast() {

    if (
        state.sending
    ) {
        return;
    }

    if (
        !state.lastUserMessage
    ) {

        showToast(
            "REGENERATE",
            "No previous user message."
        );

        return;

    }

    if (
        DOM.messageInput
    ) {

        DOM.messageInput.value =
            state.lastUserMessage;

        resizeInput();

    }

    sendMessage();

}


/* ============================================================
   SCROLL
   ============================================================ */

function scrollMessages() {

    if (
        !DOM.messagesContainer
    ) {
        return;
    }

    DOM.messagesContainer.scrollTo({

        top:
            DOM.messagesContainer.scrollHeight,

        behavior:
            "smooth"

    });

}


/* ============================================================
   AVATAR STATES
   ============================================================ */

function setAvatarThinking() {

    setAvatarState(
        "THINKING"
    );

    if (!state.avatar) {
        return;
    }

    state.avatar.setState(
        "thinking"
    );

    state.avatar.setEmotion(
        "thinking"
    );

    state.avatar.setGesture(
        "think",
        0.65
    );

}


function setAvatarIdle() {

    setAvatarState(
        "SYSTEM READY"
    );

    if (!state.avatar) {
        return;
    }

    state.avatar.setSpeaking(
        false
    );

    state.avatar.setState(
        "idle"
    );

    state.avatar.setEmotion(
        "neutral"
    );

    state.avatar.resetGesture();

}


function setAvatarState(
    value
) {

    if (
        DOM.avatarStateText
    ) {

        DOM.avatarStateText.textContent =
            value;

    }

}


function setEngineStatus(
    value
) {

    if (
        DOM.engineStatus
    ) {

        DOM.engineStatus.textContent =
            value;

    }

}


/* ============================================================
   VOICE
   ============================================================ */

function setupVoice() {

    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (Recognition) {

        state.recognitionSupported =
            true;

        state.recognition =
            new Recognition();

        state.recognition.continuous =
            false;

        state.recognition.interimResults =
            true;

        state.recognition.lang =
            "en-IN";

        state.recognition.onstart =
            voiceStarted;

        state.recognition.onresult =
            voiceResult;

        state.recognition.onerror =
            voiceError;

        state.recognition.onend =
            voiceEnded;

    }

    if (DOM.micButton) {

        DOM.micButton.addEventListener(
            "click",
            toggleVoice
        );

    }

    if (DOM.voiceButton) {

        DOM.voiceButton.addEventListener(
            "click",
            toggleVoice
        );

    }

    if (DOM.stopVoiceButton) {

        DOM.stopVoiceButton.addEventListener(
            "click",
            stopVoice
        );

    }

}


function toggleVoice() {

    if (
        !state.recognitionSupported
    ) {

        showToast(
            "VOICE",
            "Speech recognition is unavailable."
        );

        return;

    }

    if (
        state.listening
    ) {

        stopVoice();

    }
    else {

        startVoice();

    }

}


function startVoice() {

    try {

        state.recognition.start();

    }
    catch {

        // Recognition already active.

    }

}


function stopVoice() {

    if (
        state.recognition
    ) {

        try {

            state.recognition.stop();

        }
        catch {}

    }

}


function voiceStarted() {

    state.listening =
        true;

    setAvatarState(
        "LISTENING"
    );

    if (state.avatar) {

        state.avatar.setState(
            "listening"
        );

        state.avatar.setEmotion(
            "neutral"
        );

    }

    if (DOM.voiceStatus) {

        DOM.voiceStatus.textContent =
            "LISTENING";

    }

    if (DOM.voiceButtonText) {

        DOM.voiceButtonText.textContent =
            "LISTENING...";

    }

    if (DOM.voiceOverlay) {

        DOM.voiceOverlay.hidden =
            false;

    }

}


function voiceResult(event) {

    let transcript = "";

    for (
        let i =
            event.resultIndex;

        i <
        event.results.length;

        i++
    ) {

        transcript +=
            event.results[i][0]
                .transcript;

    }

    transcript =
        transcript.trim();

    if (
        DOM.messageInput &&
        transcript
    ) {

        DOM.messageInput.value =
            transcript;

        resizeInput();

    }

    if (
        DOM.voiceOverlayText
    ) {

        DOM.voiceOverlayText.textContent =
            transcript ||
            "Listening...";

    }

}


function voiceError(event) {

    showToast(
        "VOICE",
        event.error ||
        "Voice recognition error."
    );

}


function voiceEnded() {

    state.listening =
        false;

    if (DOM.voiceStatus) {

        DOM.voiceStatus.textContent =
            "STANDBY";

    }

    if (DOM.voiceButtonText) {

        DOM.voiceButtonText.textContent =
            "START LIVE MODE";

    }

    if (DOM.voiceOverlay) {

        DOM.voiceOverlay.hidden =
            true;

    }

    setAvatarIdle();

}


/* ============================================================
   TEXT TO SPEECH
   ============================================================ */

function speakText(text) {

    if (
        !state.speechSupported
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const clean =
        String(text)
            .replace(
                /```[\s\S]*?```/g,
                ""
            )
            .replace(
                /[*_#`]/g,
                ""
            )
            .trim();

    if (!clean) {
        return;
    }

    const utterance =
        new SpeechSynthesisUtterance(
            clean
        );

    utterance.rate =
        1;

    utterance.pitch =
        1;

    utterance.volume =
        1;

    utterance.onstart =
        () => {

            state.speaking =
                true;

            setAvatarState(
                "SPEAKING"
            );

            if (state.avatar) {

                state.avatar.setSpeaking(
                    true
                );

                state.avatar.setState(
                    "speaking"
                );

                state.avatar.setGesture(
                    "explain",
                    0.65
                );

            }

        };

    utterance.onend =
        finishSpeech;

    utterance.onerror =
        finishSpeech;

    window.speechSynthesis.speak(
        utterance
    );

}


function finishSpeech() {

    state.speaking =
        false;

    setAvatarIdle();

}


/* ============================================================
   FILES
   ============================================================ */

function setupFiles() {

    if (DOM.attachmentButton) {

        DOM.attachmentButton.addEventListener(
            "click",
            () => {

                DOM.fileInput?.click();

            }
        );

    }

    DOM.fileInput?.addEventListener(
        "change",
        handleFile
    );

    DOM.imageInput?.addEventListener(
        "change",
        handleImage
    );

    DOM.removeAttachment?.addEventListener(
        "click",
        clearAttachment
    );

}


function handleFile(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    state.selectedFile =
        file;

    state.selectedImage =
        null;

    showAttachment(
        file,
        "FILE"
    );

}


function handleImage(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    state.selectedImage =
        file;

    state.selectedFile =
        null;

    showAttachment(
        file,
        "IMAGE"
    );

}


function showAttachment(
    file,
    type
) {

    if (
        DOM.attachmentPreview
    ) {

        DOM.attachmentPreview.hidden =
            false;

    }

    if (
        DOM.attachmentInfo
    ) {

        DOM.attachmentInfo.textContent =
            `${type}: ${file.name}`;

    }

}


function clearAttachment() {

    state.selectedFile =
        null;

    state.selectedImage =
        null;

    if (DOM.fileInput) {

        DOM.fileInput.value =
            "";

    }

    if (DOM.imageInput) {

        DOM.imageInput.value =
            "";

    }

    if (
        DOM.attachmentPreview
    ) {

        DOM.attachmentPreview.hidden =
            true;

    }

    if (
        DOM.attachmentInfo
    ) {

        DOM.attachmentInfo.textContent =
            "";

    }

}


/* ============================================================
   NEW CHAT
   ============================================================ */

function setupNewChat() {

    DOM.newChatButton?.addEventListener(
        "click",
        createNewSession
    );

}


function createNewSession() {

    const session = {

        id:
            createId(),

        title:
            "New conversation",

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        messages:
            []

    };

    state.sessions.unshift(
        session
    );

    state.activeSessionId =
        session.id;

    saveSessions();

    renderActiveSession();

    renderSessionList();

    showToast(
        "NEW SESSION",
        "New neural session created."
    );

}


/* ============================================================
   SESSION STORAGE
   ============================================================ */

function createId() {

    return (

        Date.now().toString(
            36
        ) +

        Math.random()
            .toString(36)
            .slice(2)

    );

}


function loadSessions() {

    try {

        const raw =
            localStorage.getItem(
                CONFIG.STORAGE_KEY
            );

        state.sessions =
            raw
                ? JSON.parse(raw)
                : [];

    }
    catch {

        state.sessions =
            [];

    }

}


function saveSessions() {

    try {

        localStorage.setItem(
            CONFIG.STORAGE_KEY,
            JSON.stringify(
                state.sessions
            )
        );

        localStorage.setItem(
            CONFIG.ACTIVE_SESSION_KEY,
            state.activeSessionId ||
            ""
        );

    }
    catch (error) {

        console.warn(
            "Storage error:",
            error
        );

    }

}


function ensureActiveSession() {

    if (
        state.activeSessionId
    ) {

        const exists =
            state.sessions.some(
                session =>
                    session.id ===
                    state.activeSessionId
            );

        if (exists) {
            return;
        }

    }

    if (
        state.sessions.length
    ) {

        state.activeSessionId =
            state.sessions[0].id;

        return;

    }

    createNewSession();

}


function getActiveSession() {

    return state.sessions.find(
        session =>
            session.id ===
            state.activeSessionId
    );

}


function addToActiveSession(
    role,
    content
) {

    ensureActiveSession();

    const session =
        getActiveSession();

    if (!session) {
        return;
    }

    session.messages.push({

        id:
            createId(),

        role,

        content,

        timestamp:
            Date.now()

    });

    session.updatedAt =
        Date.now();

    if (
        role === "user" &&
        session.title ===
            "New conversation"
    ) {

        session.title =
            content.length > 34
                ? content.slice(
                    0,
                    34
                ) + "..."
                : content;

    }

    renderSessionList();

}


/* ============================================================
   RESTORE SESSION
   ============================================================ */

function restoreActiveSession() {

    const savedId =
        localStorage.getItem(
            CONFIG.ACTIVE_SESSION_KEY
        );

    if (
        savedId &&
        state.sessions.some(
            session =>
                session.id ===
                savedId
        )
    ) {

        state.activeSessionId =
            savedId;

    }
    else if (
        state.sessions.length
    ) {

        state.activeSessionId =
            state.sessions[0].id;

    }
    else {

        createNewSession();

        return;

    }

    renderActiveSession();

    renderSessionList();

}


function renderActiveSession() {

    if (!DOM.messagesContainer) {
        return;
    }

    DOM.messagesContainer.innerHTML =
        "";

    const session =
        getActiveSession();

    if (!session) {
        return;
    }

    session.messages.forEach(
        message => {

            addMessage(
                message.role === "user"
                    ? "you"
                    : "himi",

                message.content
            );

        }
    );

    if (
        session.messages.length
    ) {

        const lastUser =
            [...session.messages]
                .reverse()
                .find(
                    item =>
                        item.role ===
                        "user"
                );

        if (lastUser) {

            state.lastUserMessage =
                lastUser.content;

        }

    }

}


/* ============================================================
   SESSION LIST
   ============================================================ */

function renderSessionList(
    filter = ""
) {

    if (!DOM.sessionList) {
        return;
    }

    DOM.sessionList.innerHTML =
        "";

    const query =
        filter
            .toLowerCase()
            .trim();

    state.sessions
        .filter(
            session =>
                !query ||
                session.title
                    .toLowerCase()
                    .includes(query)
        )
        .forEach(
            session => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "session-item";

                if (
                    session.id ===
                    state.activeSessionId
                ) {

                    button.classList.add(
                        "active"
                    );

                }

                button.textContent =
                    session.title;

                button.addEventListener(
                    "click",
                    () => {

                        state.activeSessionId =
                            session.id;

                        saveSessions();

                        renderActiveSession();

                        renderSessionList(
                            query
                        );

                    }
                );

                DOM.sessionList.appendChild(
                    button
                );

            }
        );

}


function setupSearch() {

    const input =
        DOM.chatSearchInput ||
        DOM.chatSearch;

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        () => {

            renderSessionList(
                input.value
            );

        }
    );

}


/* ============================================================
   EXPORT
   ============================================================ */

function setupExport() {

    DOM.exportChatButton?.addEventListener(
        "click",
        exportConversation
    );

}


function exportConversation() {

    const session =
        getActiveSession();

    if (!session) {
        return;
    }

    const text =
        session.messages
            .map(
                item => {

                    const speaker =
                        item.role === "user"
                            ? "YOU"
                            : "HIMI";

                    return (
                        `${speaker}\n` +
                        `${item.content}\n`
                    );

                }
            )
            .join(
                "\n"
            );

    const blob =
        new Blob(
            [text],
            {
                type:
                    "text/plain"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        "himi-conversation.txt";

    link.click();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "EXPORT",
        "Conversation exported."
    );

}


/* ============================================================
   CLEAR CHAT
   ============================================================ */

function setupClearChat() {

    DOM.clearChatButton?.addEventListener(
        "click",
        clearCurrentSession
    );

}


function clearCurrentSession() {

    const session =
        getActiveSession();

    if (!session) {
        return;
    }

    session.messages =
        [];

    session.title =
        "New conversation";

    session.updatedAt =
        Date.now();

    saveSessions();

    renderActiveSession();

    showToast(
        "CLEARED",
        "Current conversation cleared."
    );

}


/* ============================================================
   CONNECTION MONITOR
   ============================================================ */

async function checkBackend() {

    try {

        const response =
            await fetch(

                CONFIG.API_BASE +
                "/health",

                {
                    method:
                        "GET",

                    signal:
                        AbortSignal.timeout(
                            5000
                        )

                }

            );

        if (!response.ok) {
            throw new Error(
                "Backend unavailable."
            );
        }

        state.connected =
            true;

        setConnectionUI(
            true
        );

    }
    catch {

        state.connected =
            false;

        setConnectionUI(
            false
        );

    }

}


function startHealthMonitor() {

    setInterval(
        checkBackend,
        CONFIG.HEALTH_INTERVAL
    );

}


function setConnectionUI(
    online
) {

    if (DOM.systemStatusText) {

        DOM.systemStatusText.textContent =
            online
                ? "SYSTEM ONLINE"
                : "LOCAL MODE";

    }

    if (DOM.onlineStateText) {

        DOM.onlineStateText.textContent =
            online
                ? "ONLINE"
                : "OFFLINE";

    }

    if (DOM.systemStatusDot) {

        DOM.systemStatusDot.classList.toggle(
            "offline",
            !online
        );

    }

    if (DOM.hologramLinkStatus) {

        DOM.hologramLinkStatus.textContent =
            online
                ? "HOLOGRAM LINK ACTIVE"
                : "LOCAL HOLOGRAM";

    }

    if (DOM.footerStatus) {

        DOM.footerStatus.textContent =
            online
                ? "ALL SYSTEMS NOMINAL"
                : "BACKEND DISCONNECTED";

    }

}


/* ============================================================
   COMPOSER
   ============================================================ */

function setComposerDisabled(
    disabled
) {

    if (DOM.messageInput) {

        DOM.messageInput.disabled =
            disabled;

    }

    if (DOM.sendButton) {

        DOM.sendButton.disabled =
            false;

        const span =
            DOM.sendButton.querySelector(
                "span"
            );

        if (span) {

            span.textContent =
                disabled
                    ? "STOP"
                    : "SEND";

        }

        DOM.sendButton.onclick =
            disabled
                ? stopGeneration
                : sendMessage;

    }

    if (DOM.micButton) {

        DOM.micButton.disabled =
            disabled;

    }

}


/* ============================================================
   SYSTEM READY
   ============================================================ */

function setSystemReady() {

    if (DOM.aiCoreStatus) {

        DOM.aiCoreStatus.textContent =
            "READY";

    }

    if (DOM.memoryStatus) {

        DOM.memoryStatus.textContent =
            "ACTIVE";

    }

    if (
        DOM.voiceStatus &&
        !state.listening
    ) {

        DOM.voiceStatus.textContent =
            "STANDBY";

    }

}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    title,
    message
) {

    if (!DOM.himiToast) {
        return;
    }

    if (DOM.toastTitle) {

        DOM.toastTitle.textContent =
            title;

    }

    if (DOM.toastMessage) {

        DOM.toastMessage.textContent =
            message;

    }

    DOM.himiToast.classList.add(
        "show"
    );

    clearTimeout(
        state.toastTimer
    );

    state.toastTimer =
        setTimeout(
            () => {

                DOM.himiToast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* ============================================================
   ERROR
   ============================================================ */

function getErrorMessage(
    error
) {

    if (
        error?.name ===
        "AbortError"
    ) {

        return "Request stopped.";

    }

    return (
        error?.message ||
        "Unknown backend error."
    );

}


/* ============================================================
   GLOBAL API
   ============================================================ */

window.HIMI = {

    state,

    sendMessage,

    stopGeneration,

    speakText,

    startVoice,

    stopVoice,

    createNewSession,

    clearCurrentSession,

    exportConversation,

    regenerateLast,

    checkBackend,

    showToast,

    avatar:
        () =>
            state.avatar

};


/* ============================================================
   STARTUP
   ============================================================ */

console.log(
    "%c HIMI HOLO AI ",
    "color:#00eaff;font-weight:bold;font-size:18px;"
);

console.log(
    "%c Feature Engine Phase 1 loaded.",
    "color:#79efff;"
);
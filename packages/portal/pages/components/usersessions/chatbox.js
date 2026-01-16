import { Button, Form, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import React, { useState, useEffect, useRef } from "react";
import {
  getChatMessages,
  saveChatMessage,
  getRefreshMessage,
} from "../../../shared/redux/slices/chatbox/chatboxManage";

const ChatBox = ({ showChat, setShowChat, scenarioTitle, rowData }) => {
  const dispatch = useDispatch();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const MAX_HEIGHT = 120; // px

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark-theme"));
    };
    console.log("rowDatarowDatarowData", rowData);

    // Initial check
    checkDarkMode();

    // Listen for changes (when dark mode button is clicked)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const chatBodyRef = useRef(null);

  const { getChatMessagesListData, saveChatMessageData, getRefreshMsg } =
    useSelector((state) => ({
      getChatMessagesListData:
        state?.chatboxManage?.getChatMessagesListData?.data,
      saveChatMessageData: state?.chatboxManage?.saveChatMessage?.data,
      getRefreshMsg: state?.chatboxManage?.getRefreshMessageData?.data,
    }));
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );
  useEffect(() => {
    if (showChat && rowData?.learner_id && showChat && rowData?.scenarioid) {
      dispatch(
        getChatMessages({
          learner_id: rowData.learner_id,
          scenarioid: rowData.scenarioid,
        })
      );
    }
  }, [showChat, rowData, dispatch]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark-theme"));
    };

    // Initial check
    checkDarkMode();

    // Listen for changes (when dark mode button is clicked)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setChatMessages(
      Array.isArray(getChatMessagesListData) ? getChatMessagesListData : []
    );
  }, [getChatMessagesListData]);

  useEffect(() => {
    if (getRefreshMsg && getRefreshMsg.length > 0) {
      let oldChat = chatMessages;
      const newChat = [...new Set([...oldChat, ...getRefreshMsg])];
      const uniqueArr = newChat.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.scenariolearnerchatid === item.scenariolearnerchatid
          )
      );
      setChatMessages(uniqueArr);
    }
  }, [getRefreshMsg]);

  const handleSend = () => {
    if (!chatInput.trim()) return;

    const payload = {
      scenarioid: rowData?.scenarioid,
      learner_id: rowData?.learner_id,
      message: chatInput.trim(),
      attachment: selectedFile
        ? { name: selectedFile.name, size: selectedFile.size }
        : null,
    };
    dispatch(saveChatMessage(payload));

    setChatInput("");
    setSelectedFile(null);
  };

  useEffect(() => {
    if (saveChatMessageData?.scenariolearnerchatid) {
      setChatMessages((prev) => [...prev, saveChatMessageData]);
    }
  }, [saveChatMessageData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
    e.target.value = null; // reset input for re-selection of same file
  };

  const handleRefresh = () => {
    if (chatMessages?.length) {
      const lastchatobject = chatMessages[chatMessages.length - 1];
      console.log("lastchatobjectlastchatobjectlastchatobject", lastchatobject);

      const payload = {
        learner_id: lastchatobject.learner_id,
        scenarioid: lastchatobject.scenarioid,
        scenariolearnerchatid: lastchatobject.scenariolearnerchatid,
      };

      dispatch(getRefreshMessage(payload));
    }
  };
  useEffect(() => {
    let intervalId;
    if (showChat && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];

      intervalId = setInterval(() => {
        const payload = {
          learner_id: lastMessage.learner_id,
          scenarioid: lastMessage.scenarioid,
          scenariolearnerchatid: lastMessage.scenariolearnerchatid,
        };
        dispatch(getRefreshMessage(payload));
      }, 15000); // refresh every 15 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId); // cleanup when chatbox closes
      }
    };
  }, [showChat, chatMessages, dispatch]);

  const wasOpened = useRef(false);

  useEffect(() => {
    if (showChat) {
      wasOpened.current = true;
    } else {
      wasOpened.current = false;
    }
  }, [showChat]);

  useEffect(() => {
    if (chatMessages.length && chatBodyRef.current && wasOpened.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark-theme"));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const resizeTextarea = (textarea) => {
    textarea.style.height = "auto";

    if (textarea.scrollHeight <= 120) {
      textarea.style.height = textarea.scrollHeight + "px";
      textarea.style.overflowY = "hidden";
    } else {
      textarea.style.height = "120px";
      textarea.style.overflowY = "auto";
    }
  };

  return (
    <>
      {showChat && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9998,
          }}
          onClick={() => setShowChat(false)}
        />
      )}
      {showChat && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "40vw",
            height: "100vh",
            backgroundColor: isDarkMode ? "#0e0e23" : "#fff",
            color: isDarkMode ? "#f1f1f1" : "#000",
            zIndex: 999999,
            boxShadow: "-4px 0 16px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "15px 20px",
              borderBottom: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
              backgroundColor: isDarkMode ? "#0e0e23" : "#f8f9fa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h5 style={{ marginBottom: "4px" }}>{scenarioTitle || "—"}</h5>
              </div>

              <Button
                variant={isDarkMode ? "dark" : "light"}
                onClick={() => setShowChat(false)}
                style={{ fontSize: "18px", lineHeight: 1, padding: "8px" }}
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Chat Body */}
          <div
            ref={chatBodyRef}
            style={{
              flex: 1,
              overflowY: "scroll",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              justifyContent: "flex-start",
              maxHeight: "calc(100vh - 100px)",
            }}
          >
            {chatMessages.length === 0 ? (
              <div
                style={{
                  alignSelf: "center",
                  background: isDarkMode ? "#0e0e23" : "#f8f9fa",
                  color: isDarkMode ? "#aaa" : "#6c757d",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  maxWidth: "75%",
                  fontStyle: "italic",
                }}
              >
                Chat here or ask a query.
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isSender =
                  msg.sender_type?.toLowerCase() ===
                  getUserDataFromLocal?.usertype?.toLowerCase();
                const senderName = isSender ? "You" : msg.sender_type;
                const formattedTime = msg.formatted_time;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isSender ? "flex-end" : "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: isDarkMode ? "#bbb" : "#6c757d",
                        marginBottom: "2px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>{senderName}</span>
                      <span style={{ whiteSpace: "nowrap" }}>
                        {formattedTime}
                      </span>
                    </span>
                    <div
                      style={{
                        backgroundColor: isSender
                          ? isDarkMode
                            ? "#37474f"
                            : "#e0f7fa"
                          : isDarkMode
                          ? "#1565c0"
                          : "#007bff",
                        color: isSender
                          ? isDarkMode
                            ? "#fff"
                            : "black"
                          : "#fff",
                        padding: "10px 15px",
                        borderRadius: "12px",
                        maxWidth: "75%",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        marginBottom: "10px",
                        wordBreak: "break-word",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{msg.message}</span>
                        {isSender && msg.status && (
                          <span style={{ fontSize: "12px" }}>
                            {msg.status === "sent" && "✓"}
                            {msg.status === "delivered" && "✓✓"}
                            {msg.status === "seen" && (
                              <span style={{ color: "blue" }}>✓✓</span>
                            )}
                          </span>
                        )}
                      </div>
                      {msg.file && (
                        <div
                          style={{
                            backgroundColor: isSender
                              ? isDarkMode
                                ? "#455a64"
                                : "#b2ebf2"
                              : isDarkMode
                              ? "#0d47a1"
                              : "#005f8a",
                            color: isSender
                              ? isDarkMode
                                ? "#fff"
                                : "black"
                              : "#fff",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            fontSize: "0.9em",
                            maxWidth: "75%",
                          }}
                        >
                          {/* file name */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 20px",
              borderTop: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
              backgroundColor: isDarkMode ? "#0e0e23" : "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <InputGroup
              style={{
                borderRadius: "30px",
                border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
                display: "flex",
                alignItems: "center",
                padding: "2px 12px",
                width: "100%",
                backgroundColor: isDarkMode ? "#0e0e23" : "#f0f0f0",
              }}
            >
              <div
                onClick={handleRefresh}
                style={{
                  cursor: "pointer",
                  padding: "6px",
                  color: "#007bff",
                  fontSize: "18px",
                  userSelect: "none",
                }}
                title="Refresh chat"
              >
                <i className="fa fa-refresh" style={{ fontSize: "18px" }}></i>
              </div>

              <div
                onClick={() => document.getElementById("fileInput").click()}
                style={{
                  cursor: "pointer",
                  padding: "6px",
                  color: "#007bff",
                  fontSize: "18px",
                  userSelect: "none",
                }}
                title="Attach file"
              ></div>

              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Form.Control
                // type="text"
                as="textarea"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                // onKeyDown={(e) => e.key === "Enter" && handleSend()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (e.shiftKey) {
                      const textarea = e.target;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const value = textarea.value;

                      const newValue =
                        value.substring(0, start) + "\n" + value.substring(end);
                      setChatInput(newValue);
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd =
                          start + 1;
                        resizeTextarea(textarea);
                      }, 0);
                      e.preventDefault();
                      return;
                    }
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onInput={(e) => resizeTextarea(e.target)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  resize: "none",
                  overflowY: "auto",
                  fontSize: "14px",
                  padding: "10px 12px",
                  borderRadius: "30px",
                  color: isDarkMode ? "#e0e0e0" : "#000",
                  lineHeight: "1.4",
                  minHeight: "40px",
                  maxHeight: `${MAX_HEIGHT}px`,
                }}
              />
              {selectedFile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: isDarkMode ? "#555" : "#e9ecef",
                    padding: "5px 10px",
                    borderRadius: "20px",
                    maxWidth: "150px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "12px",
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  <i
                    className="fa fa-file-alt"
                    style={{ color: "#007bff" }}
                  ></i>
                  <span>{selectedFile.name}</span>
                  <Button
                    variant="link"
                    style={{
                      padding: 0,
                      fontSize: "16px",
                      cursor: "pointer",
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                    onClick={() => setSelectedFile(null)}
                  >
                    ✕
                  </Button>
                </div>
              )}
              <Button
                variant="success"
                onClick={handleSend}
                style={{
                  borderRadius: "50%",
                  width: "45px",
                  height: "45px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                title="Send"
              >
                <i
                  className="fa fa-paper-plane"
                  style={{ color: "#fff", fontSize: "18px" }}
                ></i>
              </Button>
            </InputGroup>
          </div>
        </div>
      )}
    </>
  );
};
export default ChatBox;

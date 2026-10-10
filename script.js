const teamTable = document.getElementById("teamTable");
const addTeamButton = document.getElementById("addTeamButton");
const saveButton = document.getElementById("saveButton");
const statusText = document.getElementById("status");

const exportButton = document.getElementById("exportButton");
const importFile = document.getElementById("importFile");

const STORAGE_KEY = "lck_stove_league_teams";

const LANES = [
    "TOP",
    "JUNGLE",
    "MID",
    "ADC",
    "SUPPORT"
];

let teams = [];

/* =========================
   팀 데이터 생성
========================= */

function createTeam(name = "") {
    return {
        name: name,
        nameLocked: false,
        players: ["", "", "", "", ""],
        locked: [false, false, false, false, false]
    };
}

/* =========================
   기존 데이터 호환
========================= */

function normalizeTeam(team) {
    return {
        name: String(team.name ?? ""),

        nameLocked: Boolean(team.nameLocked),

        players: LANES.map((_, index) =>
            String(team.players?.[index] ?? "")
        ),

        locked: LANES.map((_, index) =>
            Boolean(team.locked?.[index])
        )
    };
}

/* =========================
   저장 데이터 불러오기
========================= */

function loadTeams() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData !== null) {
            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                throw new Error("잘못된 데이터 형식");
            }

            teams = parsedData.map(normalizeTeam);

            renderTeams();

            statusText.textContent =
                "저장된 팀과 선수 정보를 불러왔습니다.";

            return;
        }

    } catch (error) {
        teams = [];

        renderTeams();

        statusText.textContent =
            "저장 데이터를 불러오지 못했습니다. 백업 파일을 확인하세요.";

        return;
    }

    // 최초 접속 시 기본 팀
    teams = [
        createTeam("T1"),
        createTeam("Gen.G"),
        createTeam("한화생명"),
        createTeam("DK"),
        createTeam("KT"),
        createTeam("DRX"),
        createTeam("농심"),
        createTeam("BNK")
    ];

    renderTeams();
}

/* =========================
   잠금 상태 UI 적용
========================= */

function updateLockStyle(input, locked, button) {
    // 초록색 표시
    input.classList.toggle("locked-cell", locked);

    // 잠기면 읽기 전용
    // 잠금 해제하면 수정 가능
    input.readOnly = locked;

    // 접근성 및 안내
    input.setAttribute("aria-readonly", String(locked));

    input.title = locked
        ? "잠긴 상태입니다. 자물쇠 버튼으로 잠금을 해제하세요."
        : "수정할 수 있습니다.";

    // 자물쇠 버튼
    button.textContent = locked ? "🔒" : "🔓";

    button.title = locked
        ? "잠금 해제"
        : "이름 잠금";

    button.setAttribute("aria-label", button.title);

    button.setAttribute("aria-pressed", String(locked));
}

/* =========================
   변경사항 안내
========================= */

function markUnsaved() {
    statusText.textContent =
        "변경사항이 있습니다. 저장하기를 눌러주세요.";
}

/* =========================
   표 그리기
========================= */

function renderTeams() {
    teamTable.innerHTML = "";

    teams.forEach((team, teamIndex) => {
        const row = document.createElement("tr");

        /* -------------------------
           팀 이름
        ------------------------- */

        const teamCell = document.createElement("td");

        const teamWrapper = document.createElement("div");
        teamWrapper.className = "team-wrapper";

        const teamInput = document.createElement("input");

        teamInput.type = "text";
        teamInput.className = "team-input";
        teamInput.placeholder = "팀 이름";
        teamInput.value = team.name;

        const teamLockButton = document.createElement("button");

        teamLockButton.type = "button";
        teamLockButton.className = "lock-button";

        updateLockStyle(
            teamInput,
            team.nameLocked,
            teamLockButton
        );

        // 팀 이름 변경
        teamInput.addEventListener("input", event => {
            team.name = event.target.value;
            markUnsaved();
        });

        // 팀 잠금 및 해제
        teamLockButton.addEventListener("click", () => {
            team.nameLocked = !team.nameLocked;

            updateLockStyle(
                teamInput,
                team.nameLocked,
                teamLockButton
            );

            markUnsaved();
        });

        teamWrapper.append(teamInput, teamLockButton);
        teamCell.appendChild(teamWrapper);
        row.appendChild(teamCell);

        /* -------------------------
           라인별 선수 이름
        ------------------------- */

        LANES.forEach((lane, laneIndex) => {
            const cell = document.createElement("td");

            const wrapper = document.createElement("div");
            wrapper.className = "player-wrapper";

            const playerInput = document.createElement("input");

            playerInput.type = "text";
            playerInput.className = "player-input";
            playerInput.placeholder = lane;
            playerInput.value = team.players[laneIndex];

            const lockButton = document.createElement("button");

            lockButton.type = "button";
            lockButton.className = "lock-button";

            // 현재 잠금 상태 반영
            updateLockStyle(
                playerInput,
                team.locked[laneIndex],
                lockButton
            );

            // 선수 이름 변경
            playerInput.addEventListener("input", event => {
                // 잠금 상태에서는 데이터 변경도 차단
                if (team.locked[laneIndex]) {
                    playerInput.value = team.players[laneIndex];
                    return;
                }

                team.players[laneIndex] = event.target.value;

                markUnsaved();
            });

            // 잠금 및 잠금 해제
            lockButton.addEventListener("click", () => {
                team.locked[laneIndex] =
                    !team.locked[laneIndex];

                updateLockStyle(
                    playerInput,
                    team.locked[laneIndex],
                    lockButton
                );

                markUnsaved();
            });

            wrapper.append(playerInput, lockButton);

            cell.appendChild(wrapper);
            row.appendChild(cell);
        });

        /* -------------------------
           팀 삭제
        ------------------------- */

        const deleteCell = document.createElement("td");

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "삭제";

        deleteButton.addEventListener("click", () => {
            const teamName = teams[teamIndex].name || "이 팀";

            if (!confirm(`${teamName}을(를) 삭제할까요?`)) {
                return;
            }

            teams.splice(teamIndex, 1);

            renderTeams();

            markUnsaved();
        });

        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        teamTable.appendChild(row);
    });
}

/* =========================
   저장하기
========================= */

function saveTeams() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(teams)
        );

        statusText.textContent =
            "저장 완료! 선수 이름과 잠금 상태가 저장되었습니다.";

    } catch (error) {
        statusText.textContent =
            "저장에 실패했습니다. 브라우저 저장 공간을 확인하세요.";
    }
}

saveButton.addEventListener("click", saveTeams);

/* =========================
   팀 추가
========================= */

addTeamButton.addEventListener("click", () => {
    teams.push(createTeam(""));

    renderTeams();

    markUnsaved();

    const inputs = teamTable.querySelectorAll(".team-input");

    inputs[inputs.length - 1]?.focus();
});

/* =========================
   백업 파일 저장
========================= */

exportButton.addEventListener("click", () => {
    const data = JSON.stringify(teams, null, 2);

    const blob = new Blob(
        [data],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "lck-stove-league-backup.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

    statusText.textContent =
        "백업 파일을 저장했습니다.";
});

/* =========================
   백업 파일 불러오기
========================= */

importFile.addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const importedData = JSON.parse(reader.result);

            if (!Array.isArray(importedData)) {
                throw new Error("잘못된 파일 형식");
            }

            const importedTeams = importedData.map(team => {
                if (
                    !team ||
                    typeof team !== "object" ||
                    !Array.isArray(team.players)
                ) {
                    throw new Error("잘못된 팀 데이터");
                }

                return normalizeTeam(team);
            });

            if (!confirm(
                "현재 표를 백업 파일의 내용으로 교체할까요?"
            )) {
                return;
            }

            teams = importedTeams;

            renderTeams();

            saveTeams();

        } catch (error) {
            alert(
                "파일을 불러오지 못했습니다. 올바른 백업 파일인지 확인하세요."
            );
        }

        importFile.value = "";
    };

    reader.onerror = () => {
        alert("파일을 읽지 못했습니다.");
        importFile.value = "";
    };

    reader.readAsText(file);
});

/* =========================
   시작
========================= */

loadTeams();

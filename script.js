const teamTable = document.getElementById("teamTable");
const addTeamButton = document.getElementById("addTeamButton");
const saveButton = document.getElementById("saveButton");
const statusText = document.getElementById("status");

const exportButton = document.getElementById("exportButton");
const importFile = document.getElementById("importFile");

const STORAGE_KEY = "lck_stove_league_teams";

const LANES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

let teams = [];

// 새로운 팀 데이터 생성
function createTeam(name = "") {
    return {
        name,
        nameLocked: false,
        players: ["", "", "", "", ""],
        locked: [false, false, false, false, false]
    };
}

// 기존 저장 데이터와 호환되도록 변환
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

// 저장된 데이터 불러오기
function loadTeams() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                throw new Error("잘못된 데이터 형식");
            }

            teams = parsedData.map(normalizeTeam);

            renderTeams();
            statusText.textContent = "저장된 데이터를 불러왔습니다.";
            return;
        }
    } catch (error) {
        statusText.textContent =
            "데이터를 불러오지 못했습니다. 백업 파일을 확인하세요.";
        teams = [];
        renderTeams();
        return;
    }

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

// 잠금 상태에 따라 입력 칸 색상 변경
function updateLockStyle(input, locked) {
    input.classList.toggle("locked-cell", locked);

    input.title = locked
        ? "잠금 상태: 클릭하면 잠금 해제"
        : "잠금 해제 상태: 클릭하면 잠금";

    input.setAttribute("aria-pressed", String(locked));
}

// 표 그리기
function renderTeams() {
    teamTable.innerHTML = "";

    teams.forEach((team, teamIndex) => {
        const row = document.createElement("tr");

        // 팀 이름
        const teamCell = document.createElement("td");
        const teamInput = document.createElement("input");

        teamInput.type = "text";
        teamInput.className = "team-input";
        teamInput.placeholder = "팀 이름";
        teamInput.value = team.name;

        updateLockStyle(teamInput, team.nameLocked);

        teamInput.addEventListener("click", () => {
            team.nameLocked = !team.nameLocked;
            updateLockStyle(teamInput, team.nameLocked);
            markUnsaved();
        });

        teamInput.addEventListener("input", event => {
            team.name = event.target.value;
            markUnsaved();
        });

        teamCell.appendChild(teamInput);
        row.appendChild(teamCell);

        // 포지션별 선수
        LANES.forEach((lane, laneIndex) => {
            const cell = document.createElement("td");
            const playerInput = document.createElement("input");

            playerInput.type = "text";
            playerInput.className = "player-input";
            playerInput.placeholder = lane;
            playerInput.value = team.players[laneIndex];

            updateLockStyle(
                playerInput,
                team.locked[laneIndex]
            );

            // 클릭하면 잠금 / 잠금 해제
            playerInput.addEventListener("click", () => {
                team.locked[laneIndex] =
                    !team.locked[laneIndex];

                updateLockStyle(
                    playerInput,
                    team.locked[laneIndex]
                );

                markUnsaved();
            });

            playerInput.addEventListener("input", event => {
                team.players[laneIndex] = event.target.value;
                markUnsaved();
            });

            cell.appendChild(playerInput);
            row.appendChild(cell);
        });

        // 팀 삭제
        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "삭제";
        deleteButton.className = "delete-button";

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

// 변경사항 안내
function markUnsaved() {
    statusText.textContent =
        "변경사항이 있습니다. 저장하기를 눌러주세요.";
}

// 저장
function saveTeams() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(teams)
        );

        statusText.textContent =
            "저장 완료! 선수 정보와 잠금 상태가 저장되었습니다.";
    } catch (error) {
        statusText.textContent =
            "저장에 실패했습니다. 브라우저 저장 공간을 확인하세요.";
    }
}

// 팀 추가
addTeamButton.addEventListener("click", () => {
    teams.push(createTeam(""));
    renderTeams();
    markUnsaved();

    const inputs = teamTable.querySelectorAll(".team-input");
    inputs[inputs.length - 1]?.focus();
});

// 저장 버튼
saveButton.addEventListener("click", saveTeams);

// 백업 파일 저장
exportButton.addEventListener("click", () => {
    const blob = new Blob(
        [JSON.stringify(teams, null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "lck-stove-league-backup.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    statusText.textContent = "백업 파일을 저장했습니다.";
});

// 백업 파일 불러오기
importFile.addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

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

            if (!confirm("현재 표를 백업 파일의 내용으로 교체할까요?")) {
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

    reader.readAsText(file);
});

// 최초 실행
loadTeams();

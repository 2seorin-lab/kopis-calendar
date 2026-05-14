import { parseKopisDate } from '../api/kopis.js';
import { fetchMonthlyWeatherMap } from '../api/weather.js';
import { createFullModal } from './fullmodal.js';
import { createCalendarGrid } from './calendarGrid.js';


// 장르별 색상 매핑
const GENRE_COLORS = {
  '연극':            '#c1c2f3',  
  '뮤지컬':          '#e9accb',  
  '서양음악(클래식)': '#a0ddf9',  
  '한국음악(국악)':   '#ddc2f7',  
  '대중음악':         '#f59e0b',  
  '무용':            '#14b8a6',  
  '대중무용':         '#84cc16',  
  '복합':            '#afb2b7',  
  '서커스/마술':      '#f43f5e',  
};

function getGenreColor(name) {
  return GENRE_COLORS[name] || '#ffffff';   // 매칭 안 되면 기본 회색
}

export function createCalendar(container,options={}){
    const fullModal = createFullModal({ 
      onItemClick: (p) => options.onPerformanceClick(p) });
    const onMonthChange=options.onMonthChange || (()=>{}); // 부모가 넘겨주는 콜백 - 달이 바뀔 때마다 호출됨
    const onPerformanceClick  = options.onPerformanceClick  || (() => {}); // 공연 아이템 클릭 시 호출되는 콜백
    let current = new Date();  //현재 보고 있는 달
    let performances=[]; //현재 달의 공연 목록
    let weatherByDay = {};

    function render(){
        container.innerHTML = '';
        const year = current.getFullYear();
        const month = current.getMonth();



        //툴바

        const toolbar = document.createElement('div');
        toolbar.className='cal-toolbar';
        toolbar.innerHTML = `
             <button class="cal-prev">‹</button>
             <h2>${current.getFullYear()}년 ${current.getMonth() + 1}월</h2>
             <button class="cal-next">›</button>
        `;
        container.appendChild(toolbar);


        //요일헤더

        const weekdays = document.createElement('div');
        weekdays.className='cal-weekdays';
        ['일', '월', '화', '수', '목', '금', '토'].forEach((d) => {
            const cell = document.createElement('div');
            cell.className = 'weekday-cell';
            cell.innerHTML = `<div class="weekday-name">${d}</div>`;
            weekdays.appendChild(cell);
        });
        container.appendChild(weekdays); // appendChild란 DOM 요소를 부모 요소에 추가하는 메서드입니다. 이 메서드는 새로운 요소를 생성하여 부모 요소의 자식으로 추가합니다. 예를 들어, 위 코드에서는 'cal-weekdays'라는 클래스를 가진 div 요소를 생성하고, 그 안에 요일을 나타내는 div 요소들을 추가한 후, 최종적으로 이 'cal-weekdays' 요소를 container에 추가하는 역할을 합니다.

        //날짜별로 공연 묶기

        const byDay = {};
        for (const p of performances) {
        const start = parseKopisDate(p.from);
        const end = parseKopisDate(p.to);

        const day = new Date(start);
        while (day <= end) {
            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            if (!byDay[key]) byDay[key] = [];
            byDay[key].push(p);
            day.setDate(day.getDate() + 1);
        }
        }


        //날짜그리드

        const grid = createCalendarGrid({
          year,
          month,
          byDay,
          weatherByDay,
          getGenreColor,
          onPerformanceClick,
          onDayClick: (date, perfs) => {
            fullModal.open(date, perfs);
          },
          onMoreClick: (date, list) => {
            fullModal.open(date, list);
          },
        });

    container.appendChild(grid);



        //버튼 이벤트

    toolbar.querySelector('.cal-prev').addEventListener('click', async () => {
      current.setMonth(current.getMonth() - 1);
      await loadWeather();
      render();
      onMonthChange(current.getFullYear(), current.getMonth());  // 🆕 알림
    });
    toolbar.querySelector('.cal-next').addEventListener('click', async () => {
      current.setMonth(current.getMonth() + 1);
      await loadWeather();
      render();
      onMonthChange(current.getFullYear(), current.getMonth());  // 🆕 알림
    });
  }

    async function loadWeather() {
      try {
        weatherByDay = await fetchMonthlyWeatherMap(
          current.getFullYear(),
          current.getMonth(),
        );
      } catch (error) {
        console.error('날씨 로딩 실패', error);
        weatherByDay = {};
      }
    }

    render();
    queueMicrotask(async () => {
      await loadWeather();
      render();
      onMonthChange(current.getFullYear(), current.getMonth());
    });

    return{
        refresh:render,
        goToToday:async ()=> {
            current = new Date();
            await loadWeather();
            render();
            onMonthChange(current.getFullYear(), current.getMonth());  // 🆕 알림
        },
        setPerformances:(list)=> {
            performances = list;
            render();
        },
    };
}

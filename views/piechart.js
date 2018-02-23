function makeChart(canvasId) {
    var ctx = document.getElementById(canvasId).getContext('2d');
    var chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ["white", "black"],
            datasets: [{
                label: 'Color',
                data: [67,33],
                backgroundColor: ['gray', 'black'],
                borderColor: ['black', 'gray'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            title: {
                display: true,
                text: "Win Percentage"
            },
            legend: {
                position: 'bottom'
            },
            layout: {
                padding: {
                    left: 10,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            }
        }
    });
}

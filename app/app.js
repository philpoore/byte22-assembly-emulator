angular.module('A', ['ngRoute', 'ngAnimate'],
  function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
      templateUrl: 'views/main.html',
      controller: MainCntl,
      controllerAs: 'book'
    });
 
    // configure html5 to get links working on jsfiddle
    $locationProvider.html5Mode(true);
});

function toLines(str){
	return str !== "" ? str.split('\n') : [];
}



function strPad(str, len, char){
	str = str + '';
	len = len || 3;
	char = char || '0';
	var buf = (new Array(len + 1 - str.length)).join(char);	
	return buf + str;
}

var timer;

var MEM_SIZE = 16;
 
function MainCntl($scope, $route, $routeParams, $location) {
	

	$scope.first_line = 0;
	$scope.last_line = 0;

	$scope.input = localStorage.getItem("input") || "";
	$scope.code = [];
	$scope.lines = [];
	$scope.speed = 100;
	

	$scope.$watch('input', function() {
		$scope.process();
	});
	
	
	$scope.hex = function (i){
		var b = i.toString(16);
		return (new Array(5 - b.length)).join("0") + b;
	}

	//$scope.input = ['\n','\n\t// welcome to A','\n','\tlog 1','\tlog 2','\tlog 3'].join('\n');
	$scope.numberLines = function(lines){
		return lines.map(function (l, i){
			return {
				line: l,				// the line
			
				n: 			i,				// line number
				nn: 		strPad(i),		// padded line numbers
				current: 	i == $scope.pc
			};
		});
	}


	$scope.process = function (){
		$scope.lines = toLines($scope.input);	
		$scope.code = $scope.numberLines($scope.lines);
	}
	
	$scope.start = function (){
				
		$scope.process();
		console.log("code",$scope.code);

		$scope.pc = parseInt($scope.pc);
		$scope.running = true;
		// start the code
		
		timer = setInterval(function (){
			if($scope.running){
			
				var cmd = $scope.code[$scope.pc];
			
				if (cmd) {
					$scope.runCommand(cmd);
					// inc pc
					$scope.pc += 1;
				}else{
					$scope.running = false;
				}
				
			}else{
				console.log("...all done");
				window.clearInterval(timer);
			}
			$scope.$apply();
		},$scope.speed);
		
	}
	
	$scope.stop = function(){
		window.clearInterval(timer);
	}
	
	$scope.reset = function (){
		$scope.pc = 0;
		$scope.se = false;
		// registers
		$scope.ra = 0;
		$scope.rb = 0;
		$scope.rc = 0;
		$scope.rd = 0;
		$scope.re = 0;
		$scope.rf = 0;
		$scope.log = "";
		$scope.memory = new Uint8Array(MEM_SIZE);
		
		$scope.stop();
	}

	
	$scope.reset();
	$scope.process();
	
	$scope.keydown = function ($event){
		
		
		switch ($event.keyCode){
			case 9:
				$event.preventDefault();
				var start = document.getElementById("input").selectionStart;
		        var end = document.getElementById("input").selectionEnd;

		        // set textarea value to: text before caret + tab + text after caret
		        $scope.input = $scope.input.substring(0, start) + "\t" + $scope.input.substring(end);
				
				setTimeout(function (){
					document.getElementById("input").selectionStart = start + 1;
					document.getElementById("input").selectionEnd = end + 1;
				});

				break;
				
			default:
				break;
		}
	}
	
	$scope.keyup = function ($event){
		localStorage.setItem('input', $scope.input);
	}
	$scope.saveFile = function () {
		var textToWrite = $scope.input;
		var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
		var fileNameToSaveAs = "file.a";

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		
		downloadLink.click();
	}


	$scope.runCommand = function (cmd){
		//console.log("%s: %s",cmd.nn, cmd.line);
		var line = cmd.line || "";
		line = line.trim();
		
		// no op
		if (!line) {
			return;
		}
		
		// comment
		if (line.match(/^\/\//gi)){
			return;
		}
		
		// REAL Commands ^__^
		var c;
				
		// cmd : log x
		if (c = line.match(/^log (.*) "(.*)" (.*)/i)){
			log(c[1], c[2], c[3]);
		}else if (c = line.match(/^log "(.*)" (.*)/i)){
			log(c[1], c[2]);
		}else if (c = line.match(/^log (.*)/i)){
			log(c[1]);
		}
		
		// cmd : inc x
		if (c = line.match(/^inc (.*)/i)){
			inc(c[1]);
		}
		
		// cmd : dec x
		if (c = line.match(/^dec (.*)/i)){
			dec(c[1]);
		}
		
		// cmd : add x x
		if (c = line.match(/^add (.*) (.*)/i)){
			add(c[1],c[2]);
		}
		
		// cmd : sub x x
		if (c = line.match(/^sub (.*) (.*)/i)){
			sub(c[1],c[2]);
		}
		
		// cmd : add x x
		if (c = line.match(/^mul (.*) (.*)/i)){
			mul(c[1],c[2]);
		}
		
		// cmd : sub x x
		if (c = line.match(/^div (.*) (.*)/i)){
			div(c[1],c[2]);
		}
		
		// cmd : load x
		if (c = line.match(/^load (.*) (.*)/i)){
			load(c[1], c[2]);
		}
		
		// cmd : mov x
		if (c = line.match(/^mov (.*) (.*)/i)){
			mov(c[1], c[2]);
		}
		
		// cmd : cmp x
		if (c = line.match(/^cmp (.*) (.*)/i)){
			cmp(c[1], c[2]);
		}
		
		// cmd : jmp x
		if (c = line.match(/^jmp (.*)/i)){
			jump(c[1]);
		}
		
		// cmd : je x
		if (c = line.match(/^je (.*)/i)){
			je(c[1]);
		}
		
		// cmd : jn x
		if (c = line.match(/^jn (.*)/i)){
			jn(c[1]);
		}
	}
	
	
	function log(a, b, c){
		console.log(a,b);
		if ($scope[a] !== undefined && $scope[c] !== undefined){
			b = ("" + b).replace(/"/g,"");
			a = $scope[a] || "";
			c = $scope[c] || "";
			$scope.log += [a,b,c+"\n"].join(" ");
		}else if ($scope[a] !== undefined){
			$scope.log += [a," -> ",$scope[a],"\n"].join("");
		}else{
			a = ("" + a).replace(/"/g,"");
			b = $scope[b] || "";
			$scope.log += [a," ",b,"\n"].join("");
		}
	}
	
	function inc(a){
		if ($scope[a] !== undefined){
			$scope[a] += 1;
		}
	}
	function dec(a){
		if ($scope[a] !== undefined){
			$scope[a] -= 1;
		}
	}
	function add(a, b){
		if ($scope[a] !== undefined && $scope[b] !== undefined){
			$scope[a] = $scope[a] + $scope[b];
		}else{
			$scope[a] = $scope[a] + parseInt(b);
		}
	}
	function sub(a, b){
		if ($scope[a] !== undefined && $scope[b] !== undefined){
			$scope[a] = $scope[a] - $scope[b];
		}else{
			$scope[a] = $scope[a] - parseInt(b);
		}
	}
	function mul(a, b){
		if ($scope[a] !== undefined && $scope[b] !== undefined){
			$scope[a] = $scope[a] * $scope[b];
		}else{
			$scope[a] = $scope[a] * parseInt(b);
		}
	}
	function div(a, b){
		if ($scope[a] !== undefined && $scope[b] !== undefined){
			$scope[a] = Math.floor($scope[a] / $scope[b]);
		}else{
			$scope[a] = Math.floor($scope[a] / parseInt(b));
		}
	}
	function load(a, b){
		if ($scope[a] !== undefined){
			$scope[a] = parseInt(b);
		}
	}
	function mov(a, b){
		var index;
		if ($scope[a] !== undefined && $scope[b] !== undefined){
			// reg = reg
			$scope[a] = $scope[b];
		}else if ($scope[a] !== undefined && (index = b.match(/\[([0-9]*)\]/)) ){
			// reg = [mem]
			index = parseInt(index[1]);
			$scope[a] = $scope.memory[index];
		}else if ($scope[b] !== undefined && (index = a.match(/\[([0-9]*)\]/)) ){
			// [mem] = reg
			index = parseInt(index[1]);
			$scope.memory[index] = $scope[b];
		}else if ($scope[a] !== undefined && (index = b.match(/\[(.*)\]/)) ){
			// reg = [reg]
			index = index[1];
			$scope[a] = $scope.memory[$scope[index]];
		}else if ($scope[b] !== undefined && (index = a.match(/\[(.*)\]/)) ){
			// [reg] = reg
			index = index[1];
			$scope.memory[$scope[index]] = $scope[b];
		}
	}
	function jump(a){
		$scope.code.map(function (l){
			if (l.line.indexOf(a + ":") == 0){
				$scope.pc = l.n - 1;			// jump  to line before
			}
		});
	}
	function cmp(a, b){
		if ($scope[a] !== undefined && $scope[b] !== undefined){
			$scope.se = $scope[a] == $scope[b];
		}else if ($scope[a] !== undefined) {
			$scope.se = $scope[a] == parseInt(b);
		}
	}
	function je(a){
		if ($scope.se)
			jump(a)
	}
	
	function jn(a){
		if (!$scope.se)
			jump(a)
	}
	
}
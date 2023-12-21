const Struct = (...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o} , {}));
const cost_path = Struct('dist', 'path');
const neighbour = Struct('index','dist');

function Astar(map,start_node, end_node){
    var unvisited = [];
    var visited = [game.map_size * game.map_size];
    var visited_count = 0;
    var current_node = start_node;
    var best_paths = [game.map_size * game.map_size];
  
    for(let i = 0; i < game.map_size * game.map_size; i++){
      if(map[i] instanceof Building == false)
       unvisited.push(i);
      best_paths[i] = cost_path(game.map_size * game.map_size, []);
    }
  
    best_paths[start_node] = cost_path(0,[]);
      
    while(unvisited.length > 0){
        get_sasiads(map,current_node).forEach(n => {
          if(best_paths[current_node].dist + n.dist < best_paths[n.index].dist){
            best_paths[n.index].dist = best_paths[current_node].dist +n.dist;
            best_paths[n.index].path = [...best_paths[current_node].path];
            best_paths[n.index].path.push(current_node);
          }
        });
    
        unvisited.splice( unvisited.indexOf(current_node), 1 );
        visited[visited_count] = current_node;
        visited_count++;
  
        var s = game.map_size * game.map_size;
        current_node = -1;

        /*unvisited.forEach(element => {
          if(best_paths[element].dist  + dist(element, end_node)< s){
            s = best_paths[element].dist + dist(element, end_node);
            current_node = element;
          }
        });*/
        unvisited.forEach(element => {
            if(best_paths[element].dist < s){
              s = best_paths[element].dist;
              current_node = element;
            }
          });

  
      if(current_node == end_node || current_node == -1){//end
       isShowing = true; 
       visited.shift();
       best_paths[end_node].path.shift();//rozwiazanie
       return  best_paths[end_node].path;
      }  
    }
}
function dist(id1, id2){
    let y1 = (id1 - id1%game.map_size)/game.map_size;
    let x1 = id1%game.map_size;
    let y2 = (id2 - id2%game.map_size)/game.map_size;
    let x2 = id2%game.map_size;
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}
function get_sasiads(map,n){
  
    var sasiady = [];
    
    if(map[n] instanceof Building == true)
     return sasiady;
    
     if(n % game.map_size > 0 && map[n-1] instanceof Building == false)//left
     sasiady.push(neighbour(n-1, 1))
     if(n % game.map_size < game.map_size-1 && map[n+1] instanceof Building == false)//right
     sasiady.push(neighbour(n+1, 1))
    if(n > game.map_size-1 && map[n-game.map_size] instanceof Building == false)//top
     sasiady.push(neighbour(n - game.map_size, 1))
     if(n < game.map_size*game.map_size-game.map_size && map[n+game.map_size] instanceof Building == false)//bottom
     sasiady.push(neighbour(n + game.map_size, 1))
  
    return sasiady;
}
function id(x, y){
    return x + y*game.map_size;
}
function cords(id){
    let x = id%game.map_size;
    let y = (id - x)/game.map_size;
    return [x,y];
}
function dist(x1, y1, x2, y2){
  return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}
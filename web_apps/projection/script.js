'use strict';
//TODO
//torus
//gears
//export as 3mf
//export as stl
//display number of verticies, trianles and triangles displayed

class Vector3 {
    constructor(_x, _y, _z) {
        this.x = _x;
        this.y = _y;
        this.z = _z;
    }
    add(_v) {
        return new Vector3(this.x + _v.x, this.y + _v.y, this.z + _v.z);
    }
    sub(_v) {
        return new Vector3(this.x - _v.x, this.y - _v.y, this.z - _v.z);
    }
    dot(_v) {
        return this.x * _v.x + this.y * _v.y + this.z * _v.z;
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    unit() {
        let m = this.mag();
        return new Vector3(this.x / m, this.y / m, this.z / m);
    }
    mult(_a) {
        return new Vector3(this.x * _a, this.y * _a, this.z * _a);
    }
    multV(_v) {
        return new Vector3(this.x * _v.x, this.y * _v.y, this.z * _v.z);
    }
}

class Vector2 {
    constructor(_x, _y) {
        this.x = _x;
        this.y = _y;
    }
}

class Face {
    constructor(_points) {
        this.points = _points;
        this.avg_z = null;
        this.normal = null;
    }
    calculateAvgZ() {
        this.avg_z = 0;
        for (let i = 0; i < this.points.length; i++)
            this.avg_z += this.points[i].z;
        this.avg_z /= this.points.length;
    }
    calculateNormal() {
        let v1 = this.points[1].sub(this.points[0]);
        let v2 = this.points[2].sub(this.points[0]);
        this.normal = new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
        this.normal.x *= 0.1;
        this.normal.y *= 0.1;
        this.normal.z *= 0.1;
    }
}

function renderFace(_face) {
    let points = [..._face.points];
    for (let i = 0; i < points.length; i++)
        points[i] = camera.projectPointToScreen(camera.transfomedPoint(points[i]));

    if (!SETTINGS.wireframe) {
        //_face.calculateNormal();
        let dp = Math.abs(light.dot(_face.normal.unit()));
        ctx.fillStyle = rgb(dp * 255, dp * 255, dp * 255);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++)
            ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++)
            ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.stroke();
    }

}

function radians(_a) {
    return Math.PI * 2 * _a / 360;
}

function zSort(a, b) {
    return b.avg_z - a.avg_z;
}

function rgb(_r, _g, _b) {
    return 'rgb(' + _r + ',' + _g + ',' + _b + ')';
}

function frame() {
    requestAnimationFrame(frame);
    if (mesh == null) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mesh.update();
    mesh.render();
    //console.log(camera.transfomedPoint(mesh.pos));
}

function Rx(_a) {
    /*return [
        [1, 0, 0, 0],
        [0, Math.cos(_a), -Math.sin(_a), 0],
        [0, Math.sin(_a), Math.cos(_a), 0], 
        [0,0,0, 1]
    ];*/
    return [
        [1, 0, 0],
        [0, Math.cos(_a), -Math.sin(_a)],
        [0, Math.sin(_a), Math.cos(_a)]
    ];
}

function Ry(_a) {
    /*return [
        [Math.cos(_a), 0, Math.sin(_a), 0],
        [0, 1, 0, 0],
        [-Math.sin(_a), 0, Math.cos(_a), 0],
        [0,0,0, 1]
    ];*/
    return [
        [Math.cos(_a), 0, Math.sin(_a)],
        [0, 1, 0],
        [-Math.sin(_a), 0, Math.cos(_a)]
    ];
}

function Rz(_a) {
    /*return [
        [Math.cos(_a), -Math.sin(_a), 0, 0],
        [Math.sin(_a), Math.cos(_a), 0, 0],
        [0, 0, 1, 0],
        [0,0,0, 1]
    ];*/
    return [
        [Math.cos(_a), -Math.sin(_a), 0],
        [Math.sin(_a), Math.cos(_a), 0],
        [0, 0, 1]
    ];
}

function multiplyMatrices(_m1, _m2, _m3) {
    return [
        [_m1[0][0] * _m2[0][0] * _m3[0][0], _m1[1][0] * _m2[1][0] * _m3[1][0], _m1[2][0] * _m2[2][0] * _m3[2][0]],
        [_m1[0][1] * _m2[0][1] * _m3[0][1], _m1[1][1] * _m2[1][1] * _m3[1][1], _m1[2][1] * _m2[2][1] * _m3[2][1]],
        [_m1[0][2] * _m2[0][2] * _m3[0][2], _m1[1][2] * _m2[1][2] * _m3[1][2], _m1[2][2] * _m2[2][2] * _m3[2][2]]
    ];
}

function multiplyVectorWithMatrix(_v, _m) {
    return new Vector3(
        _v.x * _m[0][0] + _v.y * _m[0][1] + _v.z * _m[0][2],
        _v.x * _m[1][0] + _v.y * _m[1][1] + _v.z * _m[1][2],
        _v.x * _m[2][0] + _v.y * _m[2][1] + _v.z * _m[2][2]
    );
}

function MultiplyMatrixVector(_v, _m) {
    let x = _v.x * _m[0][0] + _v.y * _m[1][0] + _v.z * _m[2][0] + _m[3][0];
    let y = _v.x * _m[0][1] + _v.y * _m[1][1] + _v.z * _m[2][1] + _m[3][1];
    let z = _v.x * _m[0][2] + _v.y * _m[1][2] + _v.z * _m[2][2] + _m[3][2];
    let w = _v.x * _m[0][3] + _v.y * _m[1][3] + _v.z * _m[2][3] + _m[3][3];

    let out = new Vector3(x, y, z);

    if (w != 0) out.mult(1 / w);
    return out;
}

function GetProjectionMatrix(_fNear, _fFar, _fFov, _fAspectRatio) {
    let fFovRad = 1 / Math.tan(radians(SETTINGS.FOV / 2));

    return [
        [_fAspectRatio * fFovRad, 0, 0, 0],
        [0, fFovRad, 0, 0],
        [0, 0, _fFar / (_fFar - _fNear), 1],
        [0, 0, (-_fFar * _fNear) / (_fFar - _fNear), 0]
    ];
}

let canvas;
let ctx;
let mesh;

const SETTINGS = {
    shape: 'P',
    wireframe: false,
    triangles: false,
    FOV: 50,
    verticies: 4,
    resolution: 10,
    teeth: 5,
    anti: false,
    rotation: new Vector3(0.01, 0.01, 0.0),
    scale: new Vector3(1.0, 1.0, 1.0)
};

let eye = new Vector3(0.0, 0.0, -1 / Math.tan(radians(SETTINGS.FOV / 2)));
let camera;
let light = new Vector3(0.0, 0.0, 1);

class Camera {
    constructor() {
        this.pos = new Vector3(0, 0, -10);
        this.rotation = new Vector3(0.0, radians(0), 0.0);
    }
    transfomedPoint(_p) {
        let v = _p.sub(this.pos);
        let cx = Math.cos(this.rotation.x);
        let cy = Math.cos(this.rotation.y);
        let cz = Math.cos(this.rotation.z);
        let sx = Math.sin(this.rotation.x);
        let sy = Math.sin(this.rotation.y);
        let sz = Math.sin(this.rotation.z);
        let dx = cy * (sz * v.y + cz * v.x) - sy * v.z;
        let dy = sx * (cy * v.z + sy * (sz * v.y + cz * v.x)) + cx * (cz * v.y + sz * v.x);
        let dz = cx * (cy * v.z + sy * (sz * v.y + cz * v.x)) - sx * (cz * v.y + sz * v.x);
        return new Vector3(dx, dy, dz);
    }

    projectPointToScreen(_p) {
        /*let matProj = GetProjectionMatrix(0.1, 1000, SETTINGS.FOV, canvas.height/canvas.width);
        let v = MultiplyMatrixVector(_p, matProj);
        v = v.add(new Vector3(1,1,1));
        let sx = v.x * canvas.width / 2;
        let sy = v.y * canvas.width / 2;
        return new Vector2(sx, sy);*/
        let vx = (eye.z / _p.z) * _p.x + eye.x;
        let sx = canvas.width / 2 + vx * canvas.width / 2;
        let vy = (eye.z / _p.z) * _p.y + eye.y;
        let sy = canvas.height / 2 + vy * canvas.width / 2;
        return new Vector2(sx, sy);
    }
}

class Mesh {
    constructor(_v, _f) {
        this.pos = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0);
        this.verticies = _v;
        this.faces = _f;
    }
    render() {
        let rx = Rx(this.rotation.x);
        let ry = Ry(this.rotation.y);
        let rz = Rz(this.rotation.z);
        //let m = multiplyMatrices(rx, ry, rz);
        let verticies2 = new Array(this.verticies.length);

        for (let i = 0; i < this.verticies.length; i++) {
            let rv = multiplyVectorWithMatrix(this.verticies[i].multV(SETTINGS.scale), rx);
            rv = multiplyVectorWithMatrix(rv, ry);
            rv = multiplyVectorWithMatrix(rv, rz);
            verticies2[i] = new Vector3(this.pos.x + rv.x, this.pos.y + rv.y, this.pos.z + rv.z);
        }
        let faces_sorted = [];

        for (let i = 0; i < this.faces.length; i++) {
            let points = new Array(3);
            for (let j = 0; j < this.faces[i].length; j++) points[j] = verticies2[this.faces[i][j]];
            let t1 = new Face(points);
            t1.calculateNormal();

            if (!SETTINGS.wireframe) {
                if (t1.points[0].sub(camera.pos).dot(t1.normal) <= 0) {
                    faces_sorted.push(t1);
                    t1.calculateAvgZ();
                }
            } else {
                faces_sorted.push(t1);
                t1.calculateAvgZ();
            }
        }

        faces_sorted.sort(zSort);
        //console.log(faces_sorted.length);
        for (let i = 0; i < faces_sorted.length; i++)
            renderFace(faces_sorted[i]);
    }

    update() {
        this.rotation = this.rotation.add(SETTINGS.rotation);
    }
}

function getTrianglesFromPolygon(_v, _inv) {
    let triangles = [];
    let new_verticies = [];
    let n = 0;
    while (n + 2 <= _v.length) {
        triangles.push(
            [
                _v[_inv ? n + 1 : n],
                _v[_inv ? n : n + 1],
                _v[n + 2 >= _v.length ? 0 : n + 2]
            ]
        );
        new_verticies.push(_v[n + 2 >= _v.length ? 0 : n + 2]);
        n += 2;
    }
    if (_v.length % 2 == 1) new_verticies.push(_v[0]);
    if (new_verticies.length > 2)
        return triangles.concat(getTrianglesFromPolygon(new_verticies, _inv));
    return triangles;
}

function createPrism(_n, _anti, _forceTriangles) {
    let verticies = new Array(_n * 2);
    let faces = [];
    let a0 = (Math.PI * 2) / _n;
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verticies[i] = new Vector3(Math.cos(a), Math.SQRT2 / 2, Math.sin(a));
        if (_anti) a += Math.PI / _n;
        verticies[i + _n] = new Vector3(Math.cos(a), -Math.SQRT2 / 2, Math.sin(a));
    }



    for (let i = 0; i < _n; i++) {
        //side 1
        if (_forceTriangles || _anti) {
            faces.push([
                i,
                i + 1 >= _n ? 0 : i + 1,
                i + _n]);
            //side 2
            faces.push([
                i + 1 >= _n ? _n : i + 1 + _n,
                i + _n,
                i + 1 >= _n ? 0 : i + 1]);
        } else {
            faces.push([
                i,
                i + 1 >= _n ? 0 : i + 1,
                i + 1 >= _n ? _n : i + 1 + _n,
                i + _n
            ]);
        }
    }
    //top
    let v1 = new Array(_n);
    for (let i = 0; i < _n; i++) v1[i] = _n-i-1;
    //if(_forceTriangles)
        faces = faces.concat(getTrianglesFromPolygon(v1, false));
    //else
        //faces.push(v1);
    //bottom
    for (let i = 0; i < _n; i++) v1[i] = i + _n;
    if(_forceTriangles)
        faces = faces.concat(getTrianglesFromPolygon(v1, false));
    else 
        faces.push(v1);

    let p = new Mesh(verticies, faces);
    return p;
}

function createGear(_n, _forceTriangles) {
    let verts = [];
    let a0 = (Math.PI * 2) / _n;
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verts.push(new Vector3(Math.cos(a) * 0.68, Math.SQRT2 / 4, Math.sin(a) * 0.68));
    }
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verts.push(new Vector3(Math.cos(a) * 0.34, Math.SQRT2 / 4, Math.sin(a) * 0.34));
    }
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verts.push(new Vector3(Math.cos(a) * 0.68, -Math.SQRT2 / 4, Math.sin(a) * 0.68));
    }
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verts.push(new Vector3(Math.cos(a) * 0.34, -Math.SQRT2 / 4, Math.sin(a) * 0.34));
    }
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verts.push(new Vector3(Math.cos(a), Math.SQRT2 / 4, Math.sin(a)));
    }
    for (let i = 0; i < _n; i++) {
        let a = a0 * i;
        verts.push(new Vector3(Math.cos(a), -Math.SQRT2 / 4, Math.sin(a)));
    }
    let tris = [];
    for (let i = 0; i < _n; i++) {
        //TOP
        tris.push([
            i,
            i + _n,
            i + 1 == _n ? 0 : i + 1
        ]);
        tris.push([
            i + _n,
            i + 1 == _n ? _n : i + 1 + _n,
            i + 1 == _n ? 0 : i + 1
        ]);
        //BOTTOM
        tris.push([
            i + 3 * _n,
            i + 2 * _n,
            i + 1 == _n ? 2 * _n : i + 1 + 2 * _n
        ]);
        tris.push([
            i + 1 == _n ? 3 * _n : i + 1 + 3 * _n,
            i + 3 * _n,
            i + 1 == _n ? 2 * _n : i + 1 + 2 * _n
        ]);
        //SIDE IN
        tris.push([
            i + _n,
            i + 3 * _n,
            i + 1 == _n ? 3 * _n : i + 1 + 3 * _n
        ]);
        tris.push([
            i + 1 == _n ? _n : i + 1 + _n,
            i + _n,
            i + 1 == _n ? 3 * _n : i + 1 + 3 * _n
        ]);
        //SIDE OUT
        if (i % 2) {
            tris.push([
                i + 2 * _n,
                i,
                i + 1 == _n ? 2 * _n : i + 1 + 2 * _n
            ]);
            tris.push([
                i,
                i + 1 == _n ? 0 : i + 1,
                i + 1 == _n ? 2 * _n : i + 1 + 2 * _n
            ]);
        } else {//TEETH
            //TOP
            tris.push([
                i + 4 * _n,
                i,
                i + 1 == _n ? 0 : i + 1
            ]);
            tris.push([
                i + 1 + 4 * _n,
                i + 4 * _n,
                i + 1
            ]);
            //BOTTOM
            tris.push([
                i + 2 * _n,
                i + 5 * _n,
                i + 1 + 2 * _n
            ]);
            tris.push([
                i + 5 * _n,
                i + 1 + 5 * _n,
                i + 1 + 2 * _n
            ]);
            //SIDE 1
            tris.push([
                i + 2 * _n,
                i,
                i + 5 * _n,
            ]);
            tris.push([
                i,
                i + 4 * _n,
                i + 5 * _n,
            ]);
            //SIDE 2
            tris.push([
                i + 1,
                i + 1 + 2 * _n,
                i + 1 + 5 * _n,
            ]);
            tris.push([
                i + 1 + 4 * _n,
                i + 1 == _n ? 0 : i + 1,
                i + 1 + 5 * _n,
            ]);
            //FRONT
            tris.push([
                i + 4 * _n,
                i + 1 + 4 * _n,
                i + 5 * _n,
            ]);
            tris.push([
                i + 5 * _n,
                i + 1 + 4 * _n,
                i + 1 + 5 * _n,
            ]);
        }
    }
    let p = new Mesh(verts, tris);
    return p;
}

function createSphere(_r, _forceTriangles) {
    let verticies = [];
    let resolution = _r;
    let bA = 2 * Math.PI / resolution;
    verticies.push(new Vector3(0, 1, 0));
    for (let j = 1; j < resolution; j++) {
        let rB, rT, yB, yT;
        rB = Math.sin(0.5 * j * bA);
        yB = Math.cos(0.5 * j * bA);

        for (let i = 0; i < resolution; i++) {
            let a1 = i * bA;
            verticies.push(new Vector3(
                Math.sin(a1) * rB,
                yB,
                Math.cos(a1) * rB
            ));
        }
    }
    verticies.push(new Vector3(0, -1, 0));
    let faces = [];
    for (let i = 0; i < resolution; i++) {
        faces.push([
            0,
            i + 1,
            i + 1 == resolution ? 1 : i + 2]);
        faces.push([
            i + 1 + resolution * (resolution - 2),
            verticies.length - 1,
            i + 1 == resolution ? resolution * (resolution - 2) + 1 : i + 2 + resolution * (resolution - 2)]);

    }
    for (let j = 0; j < resolution - 2; j++) {
        for (let i = 0; i < resolution; i++) {
            if (_forceTriangles) {
                faces.push([
                    i + 1 + resolution * j,
                    i + 1 + resolution * (j + 1),
                    i + 1 == resolution ? 1 + resolution * (j + 1) : i + 2 + resolution * (j + 1)]);
                faces.push([
                    i + 1 == resolution ? 1 + resolution * (j) : i + 2 + resolution * (j),
                    i + 1 + resolution * j,
                    i + 1 == resolution ? 1 + resolution * (j + 1) : i + 2 + resolution * (j + 1)]);
            } else {
                faces.push([
                    i + 1 + resolution * j,
                    i + 1 + resolution * (j + 1),
                    i + 1 == resolution ? 1 + resolution * (j + 1) : i + 2 + resolution * (j + 1),
                    i + 1 == resolution ? 1 + resolution * (j) : i + 2 + resolution * (j)
                ]);
            }
        }
    }
    //console.log(faces.length, verticies.length);
    let p = new Mesh(verticies, faces);
    return p;
}

function loadModel(_name) {
    let verticies = [];
    let triangles = [];
    fetch(_name).then(response => response.text()).then(text => {
        let arr = text.split('\n');
        for (let i = 0; i < arr.length; i++) {
            let entry = arr[i].split(" ");
            if (entry[0] == 'v') {
                verticies.push(new Vector3(
                    parseFloat(entry[1]),
                    parseFloat(entry[2]),
                    parseFloat(entry[3])
                ));
            } else if (entry[0] == 'f') {
                triangles.push([
                    parseInt(entry[1]) - 1, parseInt(entry[2]) - 1, parseInt(entry[3]) - 1
                ]);
            }
        }
        mesh = new Mesh(verticies, triangles);
    })
}

function round(_f, _d) {
    let a = Math.pow(10, _d);
    return Math.round(_f * a) / a;
}

function setup() {
    canvas = document.getElementById('myCanvas');
    canvas.width = canvas.getBoundingClientRect().width;
    canvas.height = canvas.getBoundingClientRect().height;
    ctx = canvas.getContext("2d");

    mesh = createPrism(SETTINGS.verticies, SETTINGS.anti, SETTINGS.triangles);
    //mesh = createGear(SETTINGS.teeth*2);
    //loadModel('ak47.obj');
    camera = new Camera();

    requestAnimationFrame(frame);
}

function DOM_change_fov(_v) {
    SETTINGS.FOV = parseInt(_v);
    eye.z = -1 / Math.tan(radians(SETTINGS.FOV / 2));
}

function DOM_change_verticies(_v) {
    SETTINGS.verticies = parseInt(_v);
    let r = mesh.rotation;
    mesh = createPrism(SETTINGS.verticies, SETTINGS.anti, SETTINGS.triangles);
    mesh.rotation = r;
}

function DOM_change_teeth(_v) {
    SETTINGS.teeth = parseInt(_v);
    let r = mesh.rotation;
    mesh = createGear(SETTINGS.teeth * 2, SETTINGS.triangles);
    mesh.rotation = r;
}

function DOM_change_anti(_v) {
    SETTINGS.anti = _v;
    let r = mesh.rotation;
    mesh = createPrism(SETTINGS.verticies, SETTINGS.anti, SETTINGS.triangles);
    mesh.rotation = r;
}

function DOM_change_wireframe(_v) {
    SETTINGS.wireframe = _v;
}

function DOM_change_triangles(_v) {
    SETTINGS.triangles = _v;
    let r = mesh.rotation;
    switch (SETTINGS.shape) {
        case 'P': mesh = createPrism(SETTINGS.verticies, SETTINGS.anti, SETTINGS.triangles); break;
        case 'S': mesh = createSphere(SETTINGS.resolution, SETTINGS.triangles); break;
        case 'G': mesh = createGear(SETTINGS.teeth * 2, SETTINGS.triangles); break;
    }
    mesh.rotation = r;
}

function DOM_change_rotation(_t, _v) {
    switch (_t) {
        case 'X':
            SETTINGS.rotation.x = parseFloat(_v);
            break;
        case 'Y':
            SETTINGS.rotation.y = parseFloat(_v);
            break;
        case 'Z':
            SETTINGS.rotation.z = parseFloat(_v);
            break;
    }
}

function DOM_change_scale(_t, _v) {
    switch (_t) {
        case 'X':
            SETTINGS.scale.x = parseFloat(_v);
            break;
        case 'Y':
            SETTINGS.scale.y = parseFloat(_v);
            break;
        case 'Z':
            SETTINGS.scale.z = parseFloat(_v);
            break;
    }
}

function DOM_download() {
    let text = "";
    for (let i = 0; i < mesh.verticies.length; i++)
        text += "v " + round(mesh.verticies[i].x, 6) + ' ' + round(mesh.verticies[i].y, 6) + ' ' + round(mesh.verticies[i].z, 6) + '\n';
    for (let i = 0; i < mesh.faces.length; i++){
        text += 'f';
        for(let j = 0; j < mesh.faces[i].length; j++){
            text += ' ';
            text += (mesh.faces[i][j] + 1);
        }
        text += '\n';
    }
    //return;
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'model.obj');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function DOM_reset_rotation() {
    mesh.rotation = new Vector3(0, 0, 0);
}

function DOM_change_resolution(_v) {
    SETTINGS.resolution = parseInt(_v);
    mesh = createSphere(SETTINGS.resolution);
}

function DOM_change_shape(_v) {
    let menus = document.getElementById('menus').children;
    for (let i = 0; i < menus.length; i++)
        menus[i].hidden = true;
    document.getElementById('menu' + _v).hidden = false;
    SETTINGS.shape = _v;
    switch (_v) {
        case 'P': mesh = createPrism(SETTINGS.verticies, SETTINGS.anti, SETTINGS.triangles); break;
        case 'S': mesh = createSphere(SETTINGS.resolution, SETTINGS.triangles); break;
        case 'G': mesh = createGear(SETTINGS.teeth * 2, SETTINGS.triangles); break;
    }
}

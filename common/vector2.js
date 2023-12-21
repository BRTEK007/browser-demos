export class Vector2 {
	static dist(_v1 ,_v2){
		let x = _v1.x - _v2.x;
		let y = _v1.y - _v2.y;
		return Math.sqrt(x*x+y*y);
	}

	static lerp(_v1, _v2, _t) {
		return { x: _v1.x + (_v2.x - _v1.x) * _t, y: _v1.y + (_v2.y - _v1.y) * _t };
	}

	static copy(_v) {
		return { x: _v.x, y: _v.y };
	}

	static create(_x, _y) {
		return { x: _x || 0, y: _y || 0};
	}

	static add(_v1, _v2) {
		return { x: _v1.x + _v2.x, y: _v1.y + _v2.y };
	}

	static sub(_v1, _v2) {
		return { x: _v1.x - _v2.x, y: _v1.y - _v2.y };
	}

	static unit(_v) {
		let m = Math.sqrt(_v.x ** 2 + _v.y ** 2);
		return m == 0 ? { x: 0, y: 0 } : { x: _v.x / m, y: _v.y / m };
	}

	static mag(_v) {
		return Math.sqrt(_v.x ** 2 + _v.y ** 2);
	}

	static magSqr(_v) {
		return _v.x ** 2 + _v.y ** 2;
	}

	static mult(_v, _n) {
		return { x: _v.x * _n, y: _v.y * _n };
	}

	static toAngle(_v){
		return Math.atan2(_v.y, _v.x);
	}

	static fromAngle(_a){
		return {x: Math.cos(_a), y: Math.sin(_a)};
	}

	static rotateRight(_v){
		return {x: -_v.y, y: _v.x};
	}
	static rotateLeft(_v){
		return {x: _v.y, y: -_v.x};
	}
}
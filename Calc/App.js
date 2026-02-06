import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const OPS = new Set(['+', '-', '×', '÷']);

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function formatNumber(n) {
  // Avoid showing "-0"
  if (Object.is(n, -0)) return '0';
  if (!Number.isFinite(n)) return 'Erreur';
  // Keep it readable without scientific notation for typical calculator ranges
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-6)) return String(n);
  const s = n.toFixed(10).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

function tokenizeExpression(expr) {
  // expr is a compact string like: "-12.3+4×5÷2"
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ' ') {
      i += 1;
      continue;
    }
    if (OPS.has(ch)) {
      // unary minus for negative numbers
      if (ch === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'op')) {
        // parse a signed number
        let j = i + 1;
        let seenDot = false;
        if (j < expr.length && (isDigit(expr[j]) || expr[j] === '.')) {
          while (j < expr.length) {
            const c = expr[j];
            if (isDigit(c)) {
              j += 1;
              continue;
            }
            if (c === '.' && !seenDot) {
              seenDot = true;
              j += 1;
              continue;
            }
            break;
          }
          tokens.push({ type: 'num', value: parseFloat(expr.slice(i, j)) });
          i = j;
          continue;
        }
      }
      tokens.push({ type: 'op', value: ch });
      i += 1;
      continue;
    }
    if (isDigit(ch) || ch === '.') {
      let j = i;
      let seenDot = false;
      while (j < expr.length) {
        const c = expr[j];
        if (isDigit(c)) {
          j += 1;
          continue;
        }
        if (c === '.' && !seenDot) {
          seenDot = true;
          j += 1;
          continue;
        }
        break;
      }
      tokens.push({ type: 'num', value: parseFloat(expr.slice(i, j)) });
      i = j;
      continue;
    }
    throw new Error('Expression invalide');
  }
  return tokens;
}

function precedence(op) {
  if (op === '×' || op === '÷') return 2;
  if (op === '+' || op === '-') return 1;
  return 0;
}

function toRPN(tokens) {
  const output = [];
  const stack = [];
  for (const t of tokens) {
    if (t.type === 'num') output.push(t);
    else {
      while (
        stack.length &&
        stack[stack.length - 1].type === 'op' &&
        precedence(stack[stack.length - 1].value) >= precedence(t.value)
      ) {
        output.push(stack.pop());
      }
      stack.push(t);
    }
  }
  while (stack.length) output.push(stack.pop());
  return output;
}

function evalRPN(rpn) {
  const st = [];
  for (const t of rpn) {
    if (t.type === 'num') {
      st.push(t.value);
      continue;
    }
    const b = st.pop();
    const a = st.pop();
    if (typeof a !== 'number' || typeof b !== 'number') throw new Error('Expression invalide');
    switch (t.value) {
      case '+':
        st.push(a + b);
        break;
      case '-':
        st.push(a - b);
        break;
      case '×':
        st.push(a * b);
        break;
      case '÷':
        if (b === 0) throw new Error('Division par zéro');
        st.push(a / b);
        break;
      default:
        throw new Error('Opérateur invalide');
    }
  }
  if (st.length !== 1) throw new Error('Expression invalide');
  return st[0];
}

function evaluateExpression(expr) {
  if (!expr) return { ok: true, value: 0 };
  const trimmed = expr.replace(/\s+/g, '');
  // avoid trailing operator
  const last = trimmed[trimmed.length - 1];
  if (OPS.has(last)) return { ok: false, error: 'Expression incomplète' };
  const tokens = tokenizeExpression(trimmed);
  const rpn = toRPN(tokens);
  const v = evalRPN(rpn);
  return { ok: true, value: v };
}

function Button({ label, variant = 'num', onPress, wide = false, disabled = false }) {
  const style = useMemo(() => {
    const base = [styles.btn, wide && styles.btnWide, disabled && styles.btnDisabled];
    if (variant === 'op') base.push(styles.btnOp);
    if (variant === 'action') base.push(styles.btnAction);
    if (variant === 'equal') base.push(styles.btnEqual);
    return base;
  }, [variant, wide, disabled]);

  const textStyle = useMemo(() => {
    const base = [styles.btnText];
    if (variant === 'op') base.push(styles.btnTextOp);
    if (variant === 'action') base.push(styles.btnTextAction);
    if (variant === 'equal') base.push(styles.btnTextEqual);
    return base;
  }, [variant]);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
      style={({ pressed }) => [style, pressed && Platform.OS !== 'android' ? styles.pressed : null]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [expr, setExpr] = useState(''); // compact expression using + - × ÷ and decimals
  const [error, setError] = useState(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const computed = useMemo(() => {
    if (error) return { display: 'Erreur', sub: error };
    if (!expr) return { display: '0', sub: '' };
    const res = evaluateExpression(expr);
    if (!res.ok) return { display: '0', sub: '' };
    return { display: formatNumber(res.value), sub: expr };
  }, [expr, error]);

  const clearAll = () => {
    setExpr('');
    setError(null);
    setJustEvaluated(false);
  };

  const backspace = () => {
    if (error) return clearAll();
    if (!expr) return;
    setExpr((s) => s.slice(0, -1));
    setJustEvaluated(false);
  };

  const appendDigit = (d) => {
    if (error) clearAll();
    setExpr((s) => {
      if (justEvaluated) return d === '.' ? '0.' : String(d);
      return s + String(d);
    });
    setJustEvaluated(false);
  };

  const appendDot = () => {
    if (error) clearAll();
    setExpr((s) => {
      const t = s.replace(/\s+/g, '');
      // find current number segment since last operator
      let i = t.length - 1;
      while (i >= 0 && !OPS.has(t[i])) i -= 1;
      const seg = t.slice(i + 1);
      if (seg.includes('.')) return s;
      if (seg === '' || seg === '-') return s + '0.';
      return s + '.';
    });
    setJustEvaluated(false);
  };

  const appendOp = (op) => {
    if (error) clearAll();
    setExpr((s) => {
      const t = s.replace(/\s+/g, '');
      if (!t) return op === '-' ? '-' : '';
      const last = t[t.length - 1];
      if (OPS.has(last)) return t.slice(0, -1) + op; // replace operator
      return t + op;
    });
    setJustEvaluated(false);
  };

  const toggleSign = () => {
    if (error) clearAll();
    setExpr((s) => {
      const t = s.replace(/\s+/g, '');
      if (!t) return '-';
      // locate start of last number (supports unary '-')
      let i = t.length - 1;
      while (i >= 0 && !(OPS.has(t[i]))) i -= 1;
      const before = t.slice(0, i + 1);
      const seg = t.slice(i + 1);
      if (!seg) return t; // nothing to toggle
      if (seg[0] === '-') return before + seg.slice(1);
      return before + '-' + seg;
    });
    setJustEvaluated(false);
  };

  const percent = () => {
    if (error) clearAll();
    setExpr((s) => {
      const t = s.replace(/\s+/g, '');
      if (!t) return t;
      // apply % to last number segment: x -> x/100
      let i = t.length - 1;
      while (i >= 0 && !OPS.has(t[i])) i -= 1;
      const before = t.slice(0, i + 1);
      const seg = t.slice(i + 1);
      const n = Number(seg);
      if (!Number.isFinite(n)) return t;
      return before + formatNumber(n / 100);
    });
    setJustEvaluated(false);
  };

  const equals = () => {
    try {
      const res = evaluateExpression(expr.replace(/\s+/g, ''));
      if (!res.ok) {
        setError(res.error || 'Erreur');
        return;
      }
      setExpr(formatNumber(res.value));
      setError(null);
      setJustEvaluated(true);
    } catch (e) {
      setError(e?.message || 'Erreur');
    }
  };

  const keys = [
    { label: 'C', variant: 'action', onPress: clearAll },
    { label: '⌫', variant: 'action', onPress: backspace },
    { label: '÷', variant: 'op', onPress: () => appendOp('÷') },
    { label: '×', variant: 'op', onPress: () => appendOp('×') },

    { label: '7', onPress: () => appendDigit(7) },
    { label: '8', onPress: () => appendDigit(8) },
    { label: '9', onPress: () => appendDigit(9) },
    { label: '-', variant: 'op', onPress: () => appendOp('-') },

    { label: '4', onPress: () => appendDigit(4) },
    { label: '5', onPress: () => appendDigit(5) },
    { label: '6', onPress: () => appendDigit(6) },
    { label: '+', variant: 'op', onPress: () => appendOp('+') },

    { label: '1', onPress: () => appendDigit(1) },
    { label: '2', onPress: () => appendDigit(2) },
    { label: '3', onPress: () => appendDigit(3) },
    { label: '=', variant: 'equal', onPress: equals },

    { label: '+/-', variant: 'action', onPress: toggleSign },
    { label: '0', onPress: () => appendDigit(0) },
    { label: '.', onPress: appendDot },
    { label: '%', variant: 'action', onPress: percent },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.display}>
        <Text style={styles.subDisplay} numberOfLines={1} ellipsizeMode="head">
          {computed.sub}
        </Text>
        <Text style={styles.mainDisplay} numberOfLines={1} ellipsizeMode="head">
          {computed.display}
        </Text>
        {!!error && (
          <Text style={styles.errorText} numberOfLines={1}>
            {error}
          </Text>
        )}
      </View>

      <View style={styles.pad}>
        {keys.map((k) => (
          <Button key={k.label} label={k.label} variant={k.variant} onPress={k.onPress} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1216',
  },
  display: {
    flex: 0.34,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  subDisplay: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 16,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  mainDisplay: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    fontSize: 14,
  },
  pad: {
    flex: 0.66,
    padding: 14,
    gap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  btn: {
    width: '23.5%', // 4 cols with spacing
    height: 72,
    borderRadius: 18,
    backgroundColor: '#1A2028',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  btnWide: {
    width: '49.5%',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnOp: {
    backgroundColor: '#243040',
  },
  btnAction: {
    backgroundColor: '#1E2A22',
  },
  btnEqual: {
    backgroundColor: '#3F7CFF',
  },
  btnText: {
    color: '#E9EEF7',
    fontSize: 22,
    fontWeight: '700',
  },
  btnTextOp: {
    color: '#BFD2FF',
  },
  btnTextAction: {
    color: '#BFE6C8',
    fontSize: 18,
  },
  btnTextEqual: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});

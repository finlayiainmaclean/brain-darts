import { useEffect, useState, useRef } from "react";
import "./AnimatedNumberTicker.css";

const determineDirection = (first, last) => {
  if (first < last) {
    return "inc";
  } else if (first > last) {
    return "dec";
  }

  return "none";
};

const countUp = (val, max) => {
  const numberArray = [];

  for (var i = val; i <= max; i++) {
    numberArray.push(i);
  }

  return numberArray;
};

const countDown = (val, max) => {
  const numberArray = [];

  for (var i = val; i >= max; i--) {
    numberArray.push(i);
  }

  return numberArray;
};

const difference = (start, end) => {
  let longerArray;
  let shorterArray;
  let isDecreasingInLength;

  const startReversed = [...start].reverse();
  const endReversed = [...end].reverse();

  // Iterate the longer number if there's a difference
  if (startReversed.length > endReversed.length) {
    longerArray = startReversed;
    shorterArray = endReversed;
    isDecreasingInLength = true;
  } else {
    longerArray = endReversed;
    shorterArray = startReversed;
  }

  const numberColumns = longerArray.reduce((acc, item, i) => {
    let arr = [];
    const comparison = shorterArray[i];

    // If the items are the same, there’s been no change in the numbers.
    if (item === comparison) {
      arr = [item];
    } else if (item <= comparison) {
      arr = countDown(comparison, item);
    } else if (item >= comparison) {
      arr = countUp(comparison, item);
    } else if (typeof comparison === "undefined" && !isDecreasingInLength) {
      arr = [item];
    }

    acc.push(arr);

    return acc;
  }, []);

  const numberDiff = numberColumns.reverse();

  // If we are descending, reverse each individual column
  if (isDecreasingInLength) {
    return numberDiff.map((col) => col.reverse());
  }

  return numberDiff;
};

/*
 * Read the blog post here:
 * https://letsbuildui.dev/articles/building-a-react-number-ticker
 */
export const AnimatedNumberTicker = ({
  startValue = 0,
  endValue,
  duration = 1000
}) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [isReadyToAnimate, setIsReadyToAnimate] = useState(false);

  const startValueArray = Array.from(String(startValue), String);
  const endValueArray = Array.from(String(endValue), String);

  const timeoutRef = useRef();
  const elementRef = useRef();
  const heightRef = useRef();

  useEffect(() => {
    if (hasMounted) {
      setIsReadyToAnimate(true);
    } else {
      heightRef.current = elementRef.current.offsetHeight;
      setHasMounted(true);
    }
  }, [endValue]);

  useEffect(() => {
    if (isReadyToAnimate) {
      timeoutRef.current = setTimeout(() => {
        setIsReadyToAnimate(false);
      }, duration);
    }
  }, [isReadyToAnimate]);

  const diff = difference(startValueArray, endValueArray);

  return (
    <span
      className="number-ticker"
      style={{ height: `${heightRef.current}px` }}
    >
      {isReadyToAnimate ? (
        diff?.map((array, i) => {
          if (!array?.length) {
            return null;
          }

          const direction = determineDirection(
            array[0],
            array[array.length - 1]
          );

          return (
            <span key={i} className="number item">
              <span className={`col ${direction}`}>
                {array?.map((item) => (
                  <span key={`${item}-${i}`}>{item}</span>
                ))}
              </span>
            </span>
          );
        })
      ) : (
        <span ref={elementRef} className="number">
          {endValue}
        </span>
      )}
    </span>
  );
};

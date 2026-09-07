"""The Nameplate — putting text into the picture.

An f-string is a string with an f in front of it. Inside one, anything in
{curly braces} is worked out and dropped in:

    name = "Alex"
    width = 300
    print(f"Hello, {name}")               ->  Hello, Alex
    print(f"The plate is {width / 3} tall")  ->  The plate is 100.0 tall

Braces hold an expression, not just a name. Python works out what is inside,
turns the answer into text, and glues it in.

turtle.write takes four things in this order:
    the text, whether to move afterwards, how to line it up, and the font.
The font is three things of its own: family, size, style.

Run:  py -3.14 s5e2_the_nameplate.py
"""
# concepts: input, f-strings, str, int, variables, print
# dc: 14
# expect: ok
# stdin: Alex | 300

import turtle

name = input("Whose nameplate is this? ")
width = int(input("How wide should the plate be? "))

height = width / 3

print(f"Building a {width} by {height} plate for {name}.")

turtle.pensize(5)
turtle.color("gold")

turtle.penup()
turtle.goto(-width / 2, -height / 2)
turtle.pendown()

turtle.forward(width)
turtle.left(90)
turtle.forward(height)
turtle.left(90)
turtle.forward(width)
turtle.left(90)
turtle.forward(height)
turtle.left(90)

turtle.penup()
turtle.goto(0, -10)
turtle.color("black")
turtle.write(f"{name}", False, "center", ("Arial", 24, "bold"))

print(f"Plate finished: {width} by {height}, {width * 2 + height * 2} of edging.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. The plate does not resize itself around long names. Type a very long name
#    and watch it overflow. Do not fix it yet — first say out loud what number
#    would have to change and what it would have to depend on.
#
# 2. Add a second line of smaller text underneath: a title, a rank, a clan name.
#    Ask for it.
#
# 3. Make the frame color something the person chooses.
#
# 4. Print a receipt at the end using ONE f-string, on one line, that names
#    the person, the width, the height, and the area of the plate.
# -----------------------------------------------------------------------------


turtle.done()
